package microservice

type CreateMicroserviceRequest struct {
	Name        string `json:"name" binding:"required,min=2,max=100"`
	SourceType  string `json:"source_type" binding:"required,oneof=build pull"`
	Dockerfile  string `json:"dockerfile"`
	Build       string `json:"build"`
	Image       string `json:"image"`
	Environment string `json:"environment"`
	Healthcheck string `json:"healthcheck"`
	Command     string `json:"command"`
	Restart     string `json:"restart" binding:"omitempty,oneof=no always unless-stopped on-failure"`
}

type UpdateMicroserviceRequest struct {
	Name        *string `json:"name" binding:"omitempty,min=2,max=100"`
	SourceType  *string `json:"source_type" binding:"required,oneof=build pull"`
	Dockerfile  *string `json:"dockerfile"`
	Build       *string `json:"build"`
	Image       *string `json:"image"`
	Environment *string `json:"environment"`
	Healthcheck *string `json:"healthcheck"`
	Command     *string `json:"command"`
	Restart     *string `json:"restart" binding:"omitempty,oneof=no always unless-stopped on-failure"`
}
