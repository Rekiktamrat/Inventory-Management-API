import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Search, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

type SortKey = "name" | "quantity" | "price" | "date_added";

export default function Inventory() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [editItem, setEditItem] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const res = await api.get('/items/');
      return res.data.results || res.data;
    }
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories/');
      return res.data.results || res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (newItem: any) => api.post('/items/', newItem),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success("Item created successfully");
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to create item");
    }
  });

  const updateMutation = useMutation({
    mutationFn: (updatedItem: any) => api.patch(`/items/${updatedItem.id}/`, updatedItem),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success("Item updated successfully");
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to update item");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/items/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast.success("Item deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to delete item");
    }
  });

  const filtered = useMemo(() => {
    let list = items.filter((i: any) =>
      i.name.toLowerCase().includes(search.toLowerCase())
    );
    if (catFilter !== "all") list = list.filter((i: any) => String(i.category) === catFilter);
    list.sort((a: any, b: any) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [items, search, catFilter, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const openNew = () => {
    setEditItem({ name: "", description: "", quantity: 0, price: 0, category: categories[0]?.id || null });
    setDialogOpen(true);
  };

  const openEdit = (item: any) => { setEditItem({ ...item }); setDialogOpen(true); };

  const saveItem = () => {
    if (!editItem || !editItem.name || editItem.quantity < 0 || editItem.price < 0) {
      toast.error("Name, quantity and price are required.");
      return;
    }
    if (!editItem.id) {
      createMutation.mutate(editItem);
    } else {
      updateMutation.mutate(editItem);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Inventory</h1>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Add Item</Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search items…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="whitespace-nowrap">Category:</Label>
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => toggleSort("name")} className="cursor-pointer">
                  Name <ArrowUpDown className="ml-2 inline h-3 w-3" />
                </TableHead>
                <TableHead>Category</TableHead>
                <TableHead onClick={() => toggleSort("quantity")} className="cursor-pointer">
                  Quantity <ArrowUpDown className="ml-2 inline h-3 w-3" />
                </TableHead>
                <TableHead onClick={() => toggleSort("price")} className="cursor-pointer">
                  Price <ArrowUpDown className="ml-2 inline h-3 w-3" />
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.category_name}</TableCell>
                  <TableCell>
                    <Badge variant={item.quantity < 10 ? "destructive" : "secondary"}>
                      {item.quantity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground">${parseFloat(item.price).toFixed(2)}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem?.id ? "Edit Item" : "Add New Item"}</DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select value={String(editItem.category)} onValueChange={(v) => setEditItem({ ...editItem, category: parseInt(v) })}>
                  <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input id="quantity" type="number" value={editItem.quantity} onChange={(e) => setEditItem({ ...editItem, quantity: parseInt(e.target.value) })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input id="price" type="number" step="0.01" value={editItem.price} onChange={(e) => setEditItem({ ...editItem, price: parseFloat(e.target.value) })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={editItem.description} onChange={(e) => setEditItem({ ...editItem, description: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveItem} disabled={createMutation.isPending || updateMutation.isPending}>
              {editItem?.id ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
