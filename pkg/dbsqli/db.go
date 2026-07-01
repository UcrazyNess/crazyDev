package dbsqli

import (
	"fmt"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func NewDB(dbPath string) (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to open database connection: %w", err)
	}

	fmt.Printf("Connected to database at: %s\n", dbPath)

	return db, nil
}
