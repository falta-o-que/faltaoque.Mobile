-- Esquema oficial do banco hospedado, fornecido pelo usuário em 2026-09-30.
-- Referência vigente para análise da futura integração; não representa o armazenamento local do MVP.

CREATE TABLE colors (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    hex_code VARCHAR(7) NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE users (
    id VARCHAR(36) NOT NULL DEFAULT (UUID()),
    name VARCHAR(50) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    password VARCHAR(64) NOT NULL,
    avatar_id INT NOT NULL,
    role TINYINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    CONSTRAINT fk_user_avatar_color FOREIGN KEY (avatar_id) REFERENCES colors (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE pantries_invites (
    id VARCHAR(36) NOT NULL DEFAULT (UUID()),
    share_invite VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE pantries (
    id VARCHAR(36) NOT NULL DEFAULT (UUID()),
    title VARCHAR(150) NOT NULL,
    location VARCHAR(8),
    color_id INT NOT NULL,
    share_invite_id VARCHAR(36),
    PRIMARY KEY (id),
    CONSTRAINT fk_pantry_color FOREIGN KEY (color_id) REFERENCES colors (id),
    CONSTRAINT fk_pantries_invite FOREIGN KEY (share_invite_id) REFERENCES pantries_invites (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE users_pantries (
    user_id VARCHAR(36) NOT NULL,
    pantry_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (user_id, pantry_id),
    CONSTRAINT fk_users_pantries_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_users_pantries_pantry FOREIGN KEY (pantry_id) REFERENCES pantries (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE categories (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE purchases (
    id VARCHAR(36) NOT NULL DEFAULT (UUID()),
    title VARCHAR(100) NOT NULL,
    location VARCHAR(8),
    purchase_date DATE NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    total_products INT NOT NULL,
    missing_products DATE NOT NULL,
    pantry_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_purchases_pantry FOREIGN KEY (pantry_id) REFERENCES pantries (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE pantry_products (
    id VARCHAR(36) NOT NULL DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    is_in_pantry BOOLEAN NOT NULL DEFAULT TRUE,
    weight DOUBLE,
    price DECIMAL(10, 2),
    brand VARCHAR(100),
    expiration_date DATE,
    missing_date DATE,
    purchase_id VARCHAR(36) NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_pantry_products_purchase FOREIGN KEY (purchase_id) REFERENCES purchases (id),
    CONSTRAINT fk_pantry_products_category FOREIGN KEY (category_id) REFERENCES categories (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE grocery_lists (
    id VARCHAR(36) NOT NULL DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    suggestion TINYINT NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE grocery_lists_pantry_products (
    pantry_product_id VARCHAR(36) NOT NULL,
    grocery_list_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (pantry_product_id, grocery_list_id),
    CONSTRAINT fk_glpp_pantry_product FOREIGN KEY (pantry_product_id) REFERENCES pantry_products (id),
    CONSTRAINT fk_glpp_grocery_list FOREIGN KEY (grocery_list_id) REFERENCES grocery_lists (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
