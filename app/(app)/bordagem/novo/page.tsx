import { getProductionOrders } from '@/lib/production/orders';
import { getEmbroideryShipments, getNextEmbroideryShipmentCode, getSeamstresses } from '@/lib/app-data';
import { getWorkflowConfig } from '@/lib/workflow-config';
import { ShipmentForm } from './ShipmentForm';

export default async function NovaBordagemPage() {
  const [{ orders }, seamstressesResult, { shipments }, workflowConfig, nextCode] = await Promise.all([
    getProductionOrders(),
    getSeamstresses(),
    getEmbroideryShipments(),
    getWorkflowConfig(),
    getNextEmbroideryShipmentCode(),
  ]);
  const openOrders = orders.filter((order) => !['Finalizada', 'Vendida', 'Entregue'].includes(order.status));
  const activeSeamstresses = seamstressesResult.source === 'supabase'
    ? seamstressesResult.seamstresses.filter((item) => item.active)
    : [];

  return (
    <ShipmentForm
      orders={openOrders}
      seamstresses={activeSeamstresses}
      shipmentCodes={shipments.map((shipment) => shipment.code)}
      nextCode={nextCode}
      embroideryTypes={workflowConfig.embroidery_types}
    />
  );
}
