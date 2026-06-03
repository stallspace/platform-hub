-- ============================================================
-- MARCRTE — Seed Data
-- ============================================================

-- Categories
INSERT INTO categories (name, slug, description, icon, sort_order) VALUES
  ('Electronics', 'electronics', 'Phones, laptops, gadgets and tech accessories', '💻', 1),
  ('Fashion & Clothing', 'fashion-clothing', 'Apparel, shoes, accessories and jewellery', '👗', 2),
  ('Home & Garden', 'home-garden', 'Furniture, décor, tools and garden supplies', '🏡', 3),
  ('Health & Beauty', 'health-beauty', 'Skincare, wellness, vitamins and personal care', '💆', 4),
  ('Food & Beverages', 'food-beverages', 'Local produce, specialty foods and drinks', '🍎', 5),
  ('Sports & Outdoor', 'sports-outdoor', 'Fitness, outdoor gear and sporting equipment', '🏃', 6),
  ('Arts & Crafts', 'arts-crafts', 'Handmade goods, art supplies and creative materials', '🎨', 7),
  ('Books & Stationery', 'books-stationery', 'Books, office supplies and educational materials', '📚', 8),
  ('Toys & Games', 'toys-games', 'Toys, board games, puzzles and entertainment', '🎮', 9),
  ('Automotive', 'automotive', 'Car parts, accessories and maintenance products', '🚗', 10),
  ('Business & Industrial', 'business-industrial', 'Tools, machinery and business supplies', '🔧', 11),
  ('Pet Supplies', 'pet-supplies', 'Food, accessories and care products for pets', '🐾', 12);

-- Homepage Content
INSERT INTO homepage_content (section, content, is_active) VALUES
  ('hero', '{
    "headline": "South Africa''s Vetted Marketplace",
    "subheadline": "Discover trusted local vendors. Shop directly. Pay securely.",
    "cta_text": "Shop Now",
    "cta_url": "/marketplace/products",
    "secondary_cta_text": "Sell on MARCRTE",
    "secondary_cta_url": "/vendor/register",
    "background_type": "gradient"
  }', TRUE),
  ('featured_section', '{
    "title": "Featured Products",
    "subtitle": "Handpicked by our team"
  }', TRUE),
  ('vendors_section', '{
    "title": "Featured Vendors",
    "subtitle": "Trusted businesses on our platform"
  }', TRUE);
