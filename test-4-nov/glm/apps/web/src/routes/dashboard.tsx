import { getUser } from "@/functions/get-user";
import { orpc } from "@/utils/orpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
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
  const { session } = Route.useRouteContext();

  // Fetch dashboard data
  const accountsSummary = useQuery(orpc.accounts.getSummary.queryOptions());
  const budgetOverview = useQuery(orpc.budgets.getOverview.queryOptions());
  const transactionSummary = useQuery(
    orpc.transactions.getSummary.queryOptions(),
  );
  const upcomingBills = useQuery(orpc.recurring.getUpcoming.queryOptions());
  const goalsSummary = useQuery(orpc.goals.getSummary.queryOptions());

  if (
    accountsSummary.isLoading ||
    budgetOverview.isLoading ||
    transactionSummary.isLoading ||
    upcomingBills.isLoading ||
    goalsSummary.isLoading
  ) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  if (
    accountsSummary.error ||
    budgetOverview.error ||
    transactionSummary.error
  ) {
    return <div className="p-6">Error loading dashboard data</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-lg text-muted-foreground">
          Welcome back, {session?.user.name}
        </p>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <CardDescription>Across all accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {parseFloat(accountsSummary.data?.totalBalance || "0").toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {accountsSummary.data?.accountCount} accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Monthly Budget
            </CardTitle>
            <CardDescription>Total allocated budget</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${parseFloat(budgetOverview.data?.totalBudget || "0").toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              ${parseFloat(budgetOverview.data?.totalSpent || "0").toFixed(2)}{" "}
              spent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <CardDescription>Income vs Expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${parseFloat(transactionSummary.data?.net || "0").toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              ${parseFloat(transactionSummary.data?.income || "0").toFixed(2)}{" "}
              income, $
              {parseFloat(transactionSummary.data?.expenses || "0").toFixed(2)}{" "}
              expenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Goals Progress Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Savings Goals</CardTitle>
            <CardDescription>Progress toward your targets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {goalsSummary.data && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span>
                      {goalsSummary.data.overallProgressPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={goalsSummary.data.overallProgressPercentage}
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      $
                      {parseFloat(
                        goalsSummary.data.totalSavedAmount || "0",
                      ).toFixed(2)}{" "}
                      saved
                    </span>
                    <span>
                      $
                      {parseFloat(
                        goalsSummary.data.totalTargetAmount || "0",
                      ).toFixed(2)}{" "}
                      target
                    </span>
                  </div>
                </>
              )}
              <Link to="/goals">
                <Button variant="outline" size="sm" className="mt-3">
                  Manage Goals
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Bills Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Upcoming Bills
            </CardTitle>
            <CardDescription>Recurring payments due soon</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingBills.data && upcomingBills.data.length > 0 ? (
              <div className="space-y-2">
                {upcomingBills.data.slice(0, 3).map((bill) => (
                  <div
                    key={bill.id}
                    className="flex justify-between items-center text-sm"
                  >
                    <div>
                      <p className="font-medium">{bill.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(bill.nextDue).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="font-semibold text-red-600">
                      ${parseFloat(bill.amount || "0").toFixed(2)}
                    </p>
                  </div>
                ))}
                {upcomingBills.data.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{upcomingBills.data.length - 3} more bills
                  </p>
                )}
                <Link to="/recurring">
                  <Button variant="outline" size="sm" className="mt-3">
                    View All Bills
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm mb-3">
                  No upcoming bills
                </p>
                <Link to="/recurring">
                  <Button variant="outline" size="sm">
                    Set Up Recurring Bills
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Link to="/accounts">
          <Button variant="outline" className="w-full justify-start">
            Manage Accounts
          </Button>
        </Link>
        <Link to="/transactions/new">
          <Button variant="outline" className="w-full justify-start">
            Add Transaction
          </Button>
        </Link>
        <Link to="/import">
          <Button variant="outline" className="w-full justify-start">
            Import CSV
          </Button>
        </Link>
        <Link to="/budgets">
          <Button variant="outline" className="w-full justify-start">
            View Budget
          </Button>
        </Link>
        <Link to="/recurring">
          <Button variant="outline" className="w-full justify-start">
            Recurring Bills
          </Button>
        </Link>
        <Link to="/goals">
          <Button variant="outline" className="w-full justify-start">
            Savings Goals
          </Button>
        </Link>
      </div>

      {/* Recent Activity Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Categories</CardTitle>
          <CardDescription>Your current month budget status</CardDescription>
        </CardHeader>
        <CardContent>
          {budgetOverview.data?.categories &&
          budgetOverview.data.categories.length > 0 ? (
            <div className="space-y-4">
              {budgetOverview.data.categories
                .slice(0, 5)
                .map((category, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.category.color }}
                      />
                      <span className="text-sm font-medium">
                        {category.category.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        ${category.spent.toFixed(2)} / $
                        {category.allocated.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {category.percentage.toFixed(0)}% used
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No budget categories set up yet
            </p>
          )}
          <div className="mt-4">
            <Link to="/budgets">
              <Button variant="outline" size="sm">
                View All Categories
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
