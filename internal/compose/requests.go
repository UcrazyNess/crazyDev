package compose

// GenerateComposeRequest تنها استراکت ورودی از سمت API (Gin Request)
type GenerateComposeRequest struct {
	Version  string    `json:"version" binding:"required"`
	Services []Service `json:"services" binding:"required"`
	Networks []Network `json:"networks"`
	Volumes  []Volume  `json:"volumes"`
}

type Service struct {
	Name          string            `json:"name" binding:"required"`
	ContainerName string            `json:"container_name"`
	Image         string            `json:"image"`
	Restart       string            `json:"restart"`
	User          string            `json:"user"`
	Dns           []string          `json:"dns"`
	Ports         []string          `json:"ports"`
	Volumes       []string          `json:"volumes"`
	DependsOn     []string          `json:"depends_on"`
	Networks      []ServiceNetwork  `json:"networks"`
	Labels        map[string]string `json:"labels"`
	Logging       *Logging          `json:"logging"`
	Build         *Build            `json:"build"`
	Healthcheck   *Healthcheck      `json:"healthcheck"`
	Entrypoint    []string          `json:"entrypoint"`
	Command       []string          `json:"command"`
	Environment   map[string]string `json:"environment"`
	Extra         string            `json:"extra"`
}

type Network struct {
	Name     string `json:"name" binding:"required"`
	Driver   string `json:"driver"`
	Internal bool   `json:"internal"`
	Ip       string `json:"ip"`
}

type Volume struct {
	Name string `json:"name" binding:"required"`
}

type Build struct {
	Context    string            `json:"context"`
	Args       map[string]string `json:"args"`
	Dockerfile string            `json:"dockerfile"`
	Network    string            `json:"network"`
	Extra      string            `json:"extra"`
}

type Healthcheck struct {
	Test     []string `json:"test"`
	Interval string   `json:"interval"`
	Timeout  string   `json:"timeout"`
	Retries  int      `json:"retries"`
	Extra    string   `json:"extra"`
}

type Logging struct {
	Driver  string            `json:"driver"`
	Options map[string]string `json:"options"`
}

type ServiceNetwork struct {
	Name        string   `json:"name" binding:"required"`
	Ipv4Address string   `json:"ipv4_address,omitempty"`
	Ipv6Address string   `json:"ipv6_address,omitempty"`
	Aliases     []string `json:"aliases,omitempty"`
}
