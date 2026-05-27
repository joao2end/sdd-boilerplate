---
name: products
domain: products
type: aggregate
version: 1.0.0
status: draft
dependencies:
---
## Description
Products domain manages the product catalog.

## State
- Product { id, name, sku, price, category }

## Behavior
- createProduct() creates a new product
- updatePrice() updates product price

## Invariants
- SKU must be unique
- Price must be positive

## Validation Rules
- name is required
- sku must match pattern

## Examples
Create a product with name "Aspirin" and SKU "ASP-001"

## Constraints
- Must support up to 100k products
