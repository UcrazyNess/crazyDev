package migration

import (
	"crazyDev/pkg/sqlite"
)

type DockerCompose struct {
	sqlite.BaseModel

	ProjectName string      `gorm:"type:varchar(100);not null"`
	Path        string      `gorm:"type:varchar(255);not null"`
	YAMLContent string      `gorm:"type:text;not null"`
	IPs         []ComposeIP `gorm:"foreignKey:ComposeID"`
}

type ComposeIP struct {
	sqlite.BaseModel

	ComposeID uint   `gorm:"not null"`
	IPAddress string `gorm:"type:varchar(45);uniqueIndex;not null"`
}
