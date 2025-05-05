
import { useState } from "react";
import { PageLayout } from "@/components/common/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Plus, Edit, Trash2 } from "lucide-react";
import EmptyState from "@/components/dashboard/EmptyState";

const OrdersPage = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [orders, setOrders] = useState<any[]>([]); // Empty array for UI demo

  // Empty handlers
  const handleAddOrder = () => {};
  const handleEditOrder = () => {};
  const handleDeleteOrder = () => {};
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  const handleStatusChange = (value: string) => {};
  const handleTypeChange = (value: string) => {};
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {};

  return (
    <PageLayout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Bestellungen</h1>
          <Button onClick={handleAddOrder} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Neue Bestellung anlegen
          </Button>
        </div>

        <Tabs defaultValue="all" onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="all">Alle</TabsTrigger>
            <TabsTrigger value="inProgress">In Bearbeitung</TabsTrigger>
            <TabsTrigger value="completed">Abgeschlossen</TabsTrigger>
            <TabsTrigger value="cancelled">Storniert</TabsTrigger>
          </TabsList>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Select onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="pending">Ausstehend</SelectItem>
                <SelectItem value="processing">In Bearbeitung</SelectItem>
                <SelectItem value="completed">Abgeschlossen</SelectItem>
                <SelectItem value="cancelled">Storniert</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={handleTypeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Typ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Typen</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="express">Express</SelectItem>
                <SelectItem value="special">Spezial</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex-1">
              <Input
                type="search"
                placeholder="Kunde suchen..."
                onChange={handleSearchChange}
              />
            </div>
          </div>

          <TabsContent value="all" className="mt-0">
            <Card>
              <CardContent className="p-0">
                {orders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bestellnummer</TableHead>
                        <TableHead>Datum</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Typ</TableHead>
                        <TableHead>Kunde</TableHead>
                        <TableHead className="text-right">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Table content would go here if there were orders */}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyState
                    title="Keine Bestellungen vorhanden."
                    description="Erstellen Sie eine neue Bestellung, um loszulegen."
                    className="py-12"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inProgress" className="mt-0">
            <Card>
              <CardContent className="p-0">
                <EmptyState
                  title="Keine Bestellungen in Bearbeitung."
                  description="Bestellungen in Bearbeitung werden hier angezeigt."
                  className="py-12"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="mt-0">
            <Card>
              <CardContent className="p-0">
                <EmptyState
                  title="Keine abgeschlossenen Bestellungen."
                  description="Abgeschlossene Bestellungen werden hier angezeigt."
                  className="py-12"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cancelled" className="mt-0">
            <Card>
              <CardContent className="p-0">
                <EmptyState
                  title="Keine stornierten Bestellungen."
                  description="Stornierte Bestellungen werden hier angezeigt."
                  className="py-12"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default OrdersPage;
