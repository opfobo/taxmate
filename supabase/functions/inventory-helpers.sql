
-- Create a function to insert into order_inventory_items table
CREATE OR REPLACE FUNCTION public.insert_order_inventory_item(
  p_order_id UUID,
  p_ocr_item_id UUID,
  p_assigned_quantity INTEGER,
  p_created_by UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.order_inventory_items (
    order_id,
    ocr_item_id,
    assigned_quantity,
    created_by
  ) VALUES (
    p_order_id,
    p_ocr_item_id,
    p_assigned_quantity,
    p_created_by
  );
END;
$$;

-- Create a function to get order inventory items with their related information
CREATE OR REPLACE FUNCTION public.get_order_inventory_items(
  p_order_id UUID
)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY 
  SELECT json_build_object(
    'id', oii.id,
    'assigned_quantity', oii.assigned_quantity,
    'created_at', oii.created_at,
    'inventory_item', json_build_object(
      'id', ocr.id,
      'description', ocr.description,
      'unit_price', ocr.unit_price,
      'mapping', (
        SELECT json_agg(
          json_build_object(
            'invoice_date', m.invoice_date,
            'supplier_name', m.supplier_name
          )
        )
        FROM ocr_invoice_mappings m
        WHERE m.id = ocr.mapping_id
      )
    )
  )
  FROM order_inventory_items oii
  JOIN ocr_invoice_items ocr ON oii.ocr_item_id = ocr.id
  WHERE oii.order_id = p_order_id
  ORDER BY oii.created_at DESC;
END;
$$;
