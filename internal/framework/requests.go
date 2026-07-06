package framework

type CreateFrameworkRequest struct {
	Name        string `json:"name" binding:"required,min=2,max=100"`
	Language    string `json:"language" binding:"required,min=2,max=100"`
	Description string `json:"description" binding:"max=1000"`
	Website     string `json:"website" binding:"omitempty,url"`
	Repository  string `json:"repository" binding:"omitempty,url"`
	IsFeatured  bool   `json:"is_featured"`
}

type UpdateFrameworkRequest struct {
	Name        string `json:"name" binding:"omitempty,min=2,max=100"`
	Language    string `json:"language" binding:"omitempty,min=2,max=100"`
	Description string `json:"description" binding:"omitempty,max=1000"`
	Website     string `json:"website" binding:"omitempty,url"`
	Repository  string `json:"repository" binding:"omitempty,url"`
	Stars       int    `json:"stars" binding:"omitempty,gte=0"`
	IsFeatured  *bool  `json:"is_featured" binding:"omitempty"`
}
