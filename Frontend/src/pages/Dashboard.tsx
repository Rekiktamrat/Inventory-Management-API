import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, DollarSign, Users, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const LOW_STOCK_THRESHOLD = 10;

export default function Dashboard() {
  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const res = await api.get('/items/');
      return res.data.results || res.data;
    }
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users/');
      return res.data.results || res.data;
    }
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['logs'],
    queryFn: async () => {
      const res = await api.get('/logs/');
      return res.data.results || res.data;
    }
  });

  const totalItems = items.length;
  const totalQuantity = items.reduce((s: number, i: any) => s + parseInt(i.quantity), 0);
  const totalValue = items.reduce((s: number, i: any) => s + (parseInt(i.quantity) * parseFloat(i.price)), 0);
  const lowStockItems = items.filter((i: any) => i.quantity < LOW_STOCK_THRESHOLD);
  const recentChanges = [...logs].slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Package} label="Total Items" value={totalItems} />
        <StatCard icon={Package} label="Total Units" value={totalQuantity} />
        <StatCard icon={DollarSign} label="Inventory Value" value={`$${totalValue.toFixed(2)}`} />
        <StatCard icon={Users} label="Active Users" value={users.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">All items are well-stocked.</p>
            ) : (
              <div className="space-y-3">
                {lowStockItems.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between rounded-md border border-border p-3">
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category_name || 'No Category'}</p>
                    </div>
                    <Badge variant="destructive">{item.quantity} left</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Changes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentChanges.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity.</p>
              ) : recentChanges.map((c: any) => (
                <div key={c.id} className="flex items-center gap-3 rounded-md border border-border p-3">
                  {c.quantity_changed > 0 ? (
                    <TrendingUp className="h-4 w-4 shrink-0 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 shrink-0 text-destructive" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{c.item_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.action} · {c.user_username} · {new Date(c.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm font-mono font-medium text-foreground">
                    {c.quantity_changed > 0 ? "+" : ""}
                    {c.quantity_changed}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="rounded-lg bg-primary/10 p-3">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
