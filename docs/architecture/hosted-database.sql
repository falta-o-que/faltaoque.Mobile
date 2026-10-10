-- Esquema atual do banco hospedado, corrigido pelo usuário em 2026-10-01.
-- Substitui integralmente o script informado em 2026-09-30.

CREATE TABLE users (
    id VARCHAR(36) NOT NULL,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    password VARCHAR(64) NOT NULL,
    avatar TINYINT NOT NULL,
    role TINYINT NOT NULL DEFAULT 1,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE pantries_invites (
    id VARCHAR(36) NOT NULL,
    share_invite VARCHAR(255) NOT NULL,
    created_at DATE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE pantries (
    id VARCHAR(36) NOT NULL,
    title VARCHAR(150) NOT NULL,
    location VARCHAR(8),
    color TINYINT NOT NULL,
    share_invite_id VARCHAR(36),
    PRIMARY KEY (id),
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
    id VARCHAR(36) NOT NULL,
    name VARCHAR(50) NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE purchases (
    id VARCHAR(36) NOT NULL,
    location VARCHAR(8),
    purchase_date DATE NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    total_products INT NOT NULL,
    finish_products DATE NOT NULL,
    pantry_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_purchases_pantry FOREIGN KEY (pantry_id) REFERENCES pantries (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE pantry_products (
    id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    quantity TINYINT NOT NULL,
    is_in_pantry BOOLEAN NOT NULL,
    weight DOUBLE,
    price DECIMAL(10, 2),
    brand VARCHAR(100),
    expiration_date DATE,
    missing_date DATE,
    purchase_id VARCHAR(36) NOT NULL,
    category_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_pantry_products_purchase FOREIGN KEY (purchase_id) REFERENCES purchases (id),
    CONSTRAINT fk_pantry_products_category FOREIGN KEY (category_id) REFERENCES categories (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE grocery_lists (
    id VARCHAR(36) NOT NULL,
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
