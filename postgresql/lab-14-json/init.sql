-- Lab 14: ข้อมูลสำหรับฝึก JSON/JSONB

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  category VARCHAR(50),
  specs JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_settings (
  id SERIAL PRIMARY KEY,
  user_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products พร้อม JSONB specs
INSERT INTO products (name, price, category, specs) VALUES
  ('iPhone 15', 35900, 'phone', '{
    "brand": "Apple",
    "storage": "128GB",
    "ram": "6GB",
    "colors": ["black", "blue", "pink"],
    "display": {"size": 6.1, "type": "OLED"},
    "5g": true
  }'),
  ('iPhone 15 Pro', 42900, 'phone', '{
    "brand": "Apple",
    "storage": "256GB",
    "ram": "8GB",
    "colors": ["natural", "blue", "white", "black"],
    "display": {"size": 6.1, "type": "OLED", "refresh_rate": 120},
    "5g": true,
    "material": "titanium"
  }'),
  ('Samsung Galaxy S24', 29900, 'phone', '{
    "brand": "Samsung",
    "storage": "256GB",
    "ram": "8GB",
    "colors": ["black", "violet", "yellow"],
    "display": {"size": 6.2, "type": "AMOLED", "refresh_rate": 120},
    "5g": true
  }'),
  ('MacBook Air M3', 42900, 'laptop', '{
    "brand": "Apple",
    "cpu": "M3",
    "ram": "8GB",
    "storage": "256GB",
    "display": {"size": 13.6, "type": "Liquid Retina"},
    "ports": ["USB-C", "MagSafe", "headphone jack"],
    "weight_kg": 1.24
  }'),
  ('ThinkPad X1 Carbon', 55900, 'laptop', '{
    "brand": "Lenovo",
    "cpu": "Intel i7-1365U",
    "ram": "16GB",
    "storage": "512GB",
    "display": {"size": 14, "type": "IPS", "resolution": "2560x1600"},
    "ports": ["USB-C", "USB-A", "HDMI", "headphone jack"],
    "weight_kg": 1.12
  }'),
  ('AirPods Pro', 8990, 'audio', '{
    "brand": "Apple",
    "type": "in-ear",
    "noise_cancellation": true,
    "battery_hours": 6,
    "connectivity": ["Bluetooth 5.3"]
  }'),
  ('Sony WH-1000XM5', 12900, 'audio', '{
    "brand": "Sony",
    "type": "over-ear",
    "noise_cancellation": true,
    "battery_hours": 30,
    "connectivity": ["Bluetooth 5.2", "3.5mm jack"],
    "weight_g": 250
  }'),
  ('iPad Air', 22900, 'tablet', '{
    "brand": "Apple",
    "storage": "64GB",
    "ram": "8GB",
    "display": {"size": 10.9, "type": "Liquid Retina"},
    "colors": ["space gray", "blue", "pink", "purple", "starlight"],
    "apple_pencil": true
  }'),
  ('Samsung Galaxy Tab S9', 27900, 'tablet', '{
    "brand": "Samsung",
    "storage": "128GB",
    "ram": "8GB",
    "display": {"size": 11, "type": "AMOLED", "refresh_rate": 120},
    "colors": ["graphite", "beige"],
    "s_pen": true
  }'),
  ('USB-C Hub', 1290, 'accessory', '{
    "brand": "Anker",
    "ports": ["USB-C", "USB-A", "HDMI", "SD card"],
    "color": "gray"
  }');

-- User Settings พร้อม JSONB settings
INSERT INTO user_settings (user_name, email, settings) VALUES
  ('สมชาย', 'somchai@mail.com', '{
    "theme": "dark",
    "language": "th",
    "notifications": {"email": true, "sms": false, "push": true},
    "favorites": ["laptop", "phone"],
    "display_density": "comfortable"
  }'),
  ('สมหญิง', 'somying@mail.com', '{
    "theme": "light",
    "language": "en",
    "notifications": {"email": true, "sms": true, "push": false},
    "favorites": ["audio", "tablet"],
    "display_density": "compact"
  }'),
  ('มานะ', 'mana@mail.com', '{
    "theme": "dark",
    "language": "th",
    "notifications": {"email": false, "sms": false, "push": true},
    "favorites": ["phone"],
    "font_size": "large"
  }'),
  ('มานี', 'manee@mail.com', '{
    "theme": "auto",
    "language": "th",
    "notifications": {"email": true, "sms": false, "push": true},
    "favorites": ["laptop", "audio", "accessory"],
    "display_density": "comfortable",
    "beta_features": true
  }'),
  ('วิชัย', 'wichai@mail.com', '{
    "theme": "light",
    "language": "en",
    "notifications": {"email": true, "sms": true, "push": true},
    "favorites": ["phone", "tablet"]
  }');
