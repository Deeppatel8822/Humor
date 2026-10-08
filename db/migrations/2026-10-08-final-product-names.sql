-- Final Humor Luxury product names
-- Safe to run against the existing Supabase products table.
update products set name = 'Light & Shade Sunscreen SPF 50', updated_at = now() where slug = 'sunscreen-spf-50';
update products set name = 'Protein Shake Anti Hairfall Shampoo', updated_at = now() where slug = 'repair-shampoo';
update products set name = 'Silk Shake Smooth Shine Conditioner', updated_at = now() where slug = 'repair-conditioner';
update products set name = 'Milk Shake Repairing Smooth Hair Mask', updated_at = now() where slug = 'repair-hair-mask';
update products set name = 'Royal Water Soft Shower Cream', updated_at = now() where slug = 'shower-gel';
