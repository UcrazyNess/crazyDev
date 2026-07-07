package sqlite

import (
	"fmt"

	"gorm.io/gorm"
)

type PaginationResult[T any] struct {
	Data       []T    `json:"data"`
	TotalRows  int64  `json:"total_rows"`
	Offset     int    `json:"offset"`
	Limit      int    `json:"limit"`
	NextAction string `json:"next_action"`
	PrevAction string `json:"prev_action"`
}

func Paginate[T any](db *gorm.DB, offset int, limit int, path string) (*PaginationResult[T], error) {
	var results []T
	var totalRows int64

	if offset < 0 {
		offset = 0
	}
	if limit <= 0 {
		limit = 5
	}

	if err := db.Count(&totalRows).Error; err != nil {
		return nil, err
	}

	if err := db.Limit(limit).Offset(offset).Find(&results).Error; err != nil {
		return nil, err
	}

	nextActionLink := ""
	if int64(offset+limit) < totalRows {
		nextActionLink = fmt.Sprintf("%s?offset=%d&limit=%d", path, offset+limit, limit)
	}

	prevActionLink := ""
	if offset > 0 {
		prevOffset := offset - limit
		if prevOffset < 0 {
			prevOffset = 0
		}
		prevActionLink = fmt.Sprintf("%s?offset=%d&limit=%d", path, prevOffset, limit)
	}

	return &PaginationResult[T]{
		Data:       results,
		TotalRows:  totalRows,
		Offset:     offset,
		Limit:      limit,
		NextAction: nextActionLink,
		PrevAction: prevActionLink,
	}, nil
}
