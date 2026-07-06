package sqlite

import (
	"fmt"
	"log"

	"gorm.io/gorm"
)

// Migration ساختار ساده و کاربردی برای ثبت مدل‌ها
type Migration struct {
	Model     any
	TableName string
}

func RunMigrations(db *gorm.DB, mgtns ...Migration) {
	fmt.Println("🔄 Starting database migrations...")

	for _, mgnt := range mgtns {
		fmt.Printf("🔹 Migrating: %s ... ", mgnt.TableName)

		// اجرای مایگریشن GORM
		if err := db.AutoMigrate(mgnt.Model); err != nil {
			fmt.Println("❌ FAILED")
			log.Fatalf("Critical: unable to migrate model %s: %v", mgnt.TableName, err)
		}

		fmt.Println("✅ DONE")
	}

	fmt.Println("🚀 All migrations completed successfully!")
}
