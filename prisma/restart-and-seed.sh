#!/bin/bash

echo "This script will completely reset your database and populate it with test data."
echo "All existing data will be lost."
read -p "Are you sure you want to continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Operation cancelled."
    exit 1
fi

# Regenerate the client with updated schema
echo "Regenerating Prisma client..."
npx prisma generate

# Reset the database
echo "Resetting database..."
npx prisma db push --force-reset

# Regenerate client after schema push
echo "Regenerating Prisma client after schema push..."
npx prisma generate

# Run the seed script
echo "Seeding database..."
npx ts-node prisma/seed.ts

echo "Database has been reset and seeded successfully!"
