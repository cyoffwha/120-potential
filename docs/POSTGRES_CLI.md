# PostgreSQL CLI Quick Reference

This guide provides essential commands for accessing and reading PostgreSQL tables via SSH.

## 1. Connect to your server via SSH

## 2. Switch to the postgres user and open psql:
```bash
sudo -u postgres psql
```

## 3. List all databases:
```sql
\l
```

## 4. Connect to your database (e.g., `potential`):
```sql
\c potential
```

## 5. List all tables:
```sql
\dt
```

## 6. Read data from a table (e.g., `users`):
```sql
SELECT * FROM users;
```

## 7. Exit psql:
```sql
\q
```

Use these commands to inspect, query, and manage your database tables directly from your SSH session.
