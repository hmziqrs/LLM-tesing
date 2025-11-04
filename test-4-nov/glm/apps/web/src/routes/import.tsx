import { getUser } from "@/functions/get-user";
import { orpc } from "@/utils/orpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useRef } from "react";

export const Route = createFileRoute("/import")({
	component: RouteComponent,
	beforeLoad: async () => {
		const session = await getUser();
		return { session };
	},
	loader: async ({ context }) => {
		if (!context.session) {
			throw redirect({
				to: "/login",
			});
		}
	},
});

function RouteComponent() {
	const { session: _session } = Route.useRouteContext();
	const queryClient = useQueryClient();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [currentStep, setCurrentStep] = useState<'upload' | 'mapping' | 'preview' | 'complete'>('upload');
	const [csvFile, setCsvFile] = useState<File | null>(null);
	const [csvData, setCsvData] = useState<any>(null);
	const [mapping, setMapping] = useState<any>(null);
	const [previewData, setPreviewData] = useState<any>(null);
	const [selectedAccount, setSelectedAccount] = useState<number | null>(null);

	const { data: accounts } = useQuery(orpc.accounts.getAll.queryOptions());
	const { data: csvFormats } = useQuery(orpc.csv.getCsvFormats.queryOptions());

	const parseCsvMutation = useMutation({
		mutationFn: orpc.csv.parseCsv.mutate,
		onSuccess: (data) => {
			setCsvData(data);
			setCurrentStep('mapping');
		},
	});

	const validateMappingMutation = useMutation({
		mutationFn: orpc.csv.validateMapping.mutate,
		onSuccess: (data) => {
			setPreviewData(data);
			if (data.canImport) {
				setCurrentStep('preview');
			}
		},
	});

	const importMutation = useMutation({
		mutationFn: orpc.csv.importTransactions.mutate,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: orpc.transactions.getAll.queryKey() });
			queryClient.invalidateQueries({ queryKey: orpc.accounts.getSummary.queryKey() });
			setCurrentStep('complete');
		},
	});

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file && file.type === 'text/csv') {
			setCsvFile(file);
			const reader = new FileReader();
			reader.onload = (e) => {
				const content = e.target?.result as string;
				parseCsvMutation.mutate({ csvContent: content });
			};
			reader.readAsText(file);
		}
	};

	const handleMappingSubmit = () => {
		if (!csvData || !mapping || !selectedAccount) return;

		validateMappingMutation.mutate({
			dataRows: csvData.dataRows,
			mapping,
			accountId: selectedAccount,
		});
	};

	const handleImport = () => {
		if (!csvFile || !csvData || !mapping || !selectedAccount) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			const content = e.target?.result as string;
			const lines = content.split('\n').filter(line => line.trim());
			const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
			const dataRows = lines.slice(1).map(line => {
				const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
				const row: Record<string, string> = {};
				headers.forEach((header, index) => {
					row[header] = values[index] || '';
				});
				return row;
			});

			importMutation.mutate({
				fileName: csvFile.name,
				csvData: dataRows,
				mapping,
				accountId: selectedAccount,
			});
		};
		reader.readAsText(csvFile);
	};

	const resetImport = () => {
		setCurrentStep('upload');
		setCsvFile(null);
		setCsvData(null);
		setMapping(null);
		setPreviewData(null);
		setSelectedAccount(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	if (currentStep === 'upload') {
		return (
			<div className="p-6 space-y-6 max-w-4xl mx-auto">
				<div>
					<h1 className="text-3xl font-bold">Import Transactions</h1>
					<p className="text-muted-foreground">Upload a CSV file to import your transactions</p>
				</div>

				{/* CSV Format Info */}
				{csvFormats && (
					<Card>
						<CardHeader>
							<CardTitle>Supported CSV Formats</CardTitle>
							<CardDescription>Your CSV should contain these columns</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{csvFormats.supportedFormats.map((format, index) => (
									<div key={index} className="border rounded-lg p-4">
										<div className="flex justify-between items-start mb-2">
											<h4 className="font-medium">{format.name}</h4>
											<Badge variant="outline">{format.columns.length} columns</Badge>
										</div>
										<p className="text-sm text-muted-foreground mb-2">{format.description}</p>
										<div className="bg-muted p-2 rounded text-sm font-mono">
											{format.example}
										</div>
										<div className="flex flex-wrap gap-1 mt-2">
											{format.columns.map((col, colIndex) => (
												<Badge key={colIndex} variant="secondary" className="text-xs">
													{col}
												</Badge>
											))}
										</div>
									</div>
								))}
							</div>
							<div className="mt-4">
								<h5 className="font-medium mb-2">Tips:</h5>
								<ul className="text-sm text-muted-foreground space-y-1">
									{csvFormats.tips.map((tip, index) => (
										<li key={index}>• {tip}</li>
									))}
								</ul>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Upload Area */}
				<Card>
					<CardHeader>
						<CardTitle>Upload CSV File</CardTitle>
						<CardDescription>Select a CSV file from your computer</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
							<input
								ref={fileInputRef}
								type="file"
								accept=".csv"
								onChange={handleFileUpload}
								className="hidden"
								id="csv-upload"
							/>
							<label htmlFor="csv-upload" className="cursor-pointer">
								<div className="space-y-2">
									<p className="text-lg font-medium">Click to upload CSV file</p>
									<p className="text-sm text-muted-foreground">or drag and drop</p>
									<p className="text-xs text-muted-foreground">CSV files only</p>
								</div>
							</label>
						</div>
						{parseCsvMutation.isPending && (
							<p className="text-center mt-4">Parsing CSV file...</p>
						)}
						{parseCsvMutation.error && (
							<p className="text-center text-destructive mt-4">
								Error: {parseCsvMutation.error.message}
							</p>
						)}
					</CardContent>
				</Card>
			</div>
		);
	}

	if (currentStep === 'mapping' && csvData) {
		return (
			<div className="p-6 space-y-6 max-w-4xl mx-auto">
				<div>
					<h1 className="text-3xl font-bold">Map CSV Columns</h1>
					<p className="text-muted-foreground">Match your CSV columns to transaction fields</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Column Mapping</CardTitle>
						<CardDescription>
							Found {csvData.totalRows} rows in {csvFile?.name}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-6">
							{/* Account Selection */}
							<div>
								<label className="block text-sm font-medium mb-2">Import to Account *</label>
								<select
									value={selectedAccount || ''}
									onChange={(e) => setSelectedAccount(Number(e.target.value))}
									className="w-full p-2 border rounded-md"
								>
									<option value="">Select an account...</option>
									{accounts?.map((account) => (
										<option key={account.id} value={account.id}>
											{account.name} ({account.type})
										</option>
									))}
								</select>
							</div>

							{/* Column Mapping */}
							{[
								{ field: 'date', label: 'Date *', required: true },
								{ field: 'description', label: 'Description *', required: true },
								{ field: 'amount', label: 'Amount *', required: true },
								{ field: 'type', label: 'Type (optional)', required: false },
								{ field: 'category', label: 'Category (optional)', required: false },
								{ field: 'note', label: 'Note (optional)', required: false },
							].map(({ field, label, required: _required }) => (
								<div key={field}>
									<label className="block text-sm font-medium mb-2">
										{label}
									</label>
									<select
										value={mapping?.[field] || ''}
										onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
										className="w-full p-2 border rounded-md"
									>
										<option value="">Select column...</option>
										{csvData.headers.map((header: string) => (
											<option key={header} value={header}>
												{header}
											</option>
										))}
									</select>
								</div>
							))}

							<div className="flex space-x-2">
								<Button
									onClick={handleMappingSubmit}
									disabled={!selectedAccount || !mapping?.date || !mapping?.description || !mapping?.amount}
								>
									Preview Import
								</Button>
								<Button variant="outline" onClick={resetImport}>
									Cancel
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (currentStep === 'preview' && previewData) {
		return (
			<div className="p-6 space-y-6 max-w-4xl mx-auto">
				<div>
					<h1 className="text-3xl font-bold">Preview Import</h1>
					<p className="text-muted-foreground">Review your transactions before importing</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Import Summary</CardTitle>
						<CardDescription>
							{previewData.validCount} valid, {previewData.invalidCount} invalid transactions
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{previewData.preview.map((transaction: any, index: number) => (
								<div
									key={index}
									className={`p-4 border rounded-lg ${
										transaction.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
									}`}
								>
									<div className="flex justify-between items-start">
										<div>
											<p className="font-medium">{transaction.description}</p>
											<p className="text-sm text-muted-foreground">
												{transaction.date} • {transaction.categoryName}
											</p>
											{transaction.note && (
												<p className="text-sm text-muted-foreground">{transaction.note}</p>
											)}
										</div>
										<div className="text-right">
											<p className={`font-semibold ${
												transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
											}`}>
												{transaction.type === 'income' ? '+' : '-'}${Math.abs(parseFloat(transaction.amount)).toFixed(2)}
											</p>
											<Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
												{transaction.type}
											</Badge>
										</div>
									</div>
									{!transaction.isValid && (
										<p className="text-sm text-red-600 mt-2">Error: {transaction.error}</p>
									)}
								</div>
							))}

							<div className="flex space-x-2 pt-4">
								<Button
									onClick={handleImport}
									disabled={!previewData.canImport || importMutation.isPending}
								>
									{importMutation.isPending ? 'Importing...' : `Import ${previewData.validCount} Transactions`}
								</Button>
								<Button variant="outline" onClick={() => setCurrentStep('mapping')}>
									Back to Mapping
								</Button>
								<Button variant="outline" onClick={resetImport}>
									Cancel
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (currentStep === 'complete' && importMutation.data) {
		return (
			<div className="p-6 space-y-6 max-w-4xl mx-auto">
				<div>
					<h1 className="text-3xl font-bold">Import Complete!</h1>
					<p className="text-muted-foreground">Your transactions have been imported successfully</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Import Results</CardTitle>
						<CardDescription>{importMutation.data.fileName}</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="grid grid-cols-3 gap-4">
								<div className="text-center">
									<p className="text-2xl font-bold text-green-600">{importMutation.data.successCount}</p>
									<p className="text-sm text-muted-foreground">Successfully imported</p>
								</div>
								<div className="text-center">
									<p className="text-2xl font-bold text-red-600">{importMutation.data.errorCount}</p>
									<p className="text-sm text-muted-foreground">Failed to import</p>
								</div>
								<div className="text-center">
									<p className="text-2xl font-bold">{importMutation.data.totalRows}</p>
									<p className="text-sm text-muted-foreground">Total rows</p>
								</div>
							</div>

							{importMutation.data.errors.length > 0 && (
								<div>
									<h4 className="font-medium mb-2">Import Errors:</h4>
									<div className="space-y-1 max-h-32 overflow-y-auto">
										{importMutation.data.errors.map((error: any, index: number) => (
											<p key={index} className="text-sm text-red-600">
												Row {error.row}: {error.error}
											</p>
										))}
									</div>
								</div>
							)}

							<div className="flex space-x-2 pt-4">
								<Button onClick={resetImport}>
									Import Another File
								</Button>
								<Button variant="outline">
									View Transactions
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return null;
}