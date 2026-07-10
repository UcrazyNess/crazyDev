package compose

import (
	"gopkg.in/yaml.v3"
)

// تابع کمکی برای اضافه کردن کلید و مقدار به یک نودِ مپ با حفظ ترتیب
func appendMapField(target *yaml.Node, key string, value interface{}) {
	// ایجاد نودِ کلید
	target.Content = append(target.Content, &yaml.Node{
		Kind:  yaml.ScalarNode,
		Value: key,
	})

	// بررسی اینکه آیا مقدار خودش یک نود است یا دیتای معمولی
	if node, ok := value.(*yaml.Node); ok {
		target.Content = append(target.Content, node)
	} else {
		// اگر دیتای معمولی بود، بگذار خود پکیج تبدیلش کنه
		var valueNode yaml.Node
		_ = valueNode.Encode(value)
		target.Content = append(target.Content, &valueNode)
	}
}

func GenerateComposeYAML(req GenerateComposeRequest) ([]byte, error) {
	// ۱. نود اصلی مانیفست (ترتیب این بخش خیلی مهمه)
	rootNode := &yaml.Node{Kind: yaml.MappingNode}

	// اول از همه اسم پروژه و ورژن رو می‌ذاریم بالاترین قسمت فایل
	appendMapField(rootNode, "version", req.Version)

	// ۲. پردازش سرویس‌ها
	servicesNode := &yaml.Node{Kind: yaml.MappingNode}
	for _, svc := range req.Services {
		sNode := &yaml.Node{Kind: yaml.MappingNode}

		// 🎯 اینجا ترتیب نمایش فیلدهای داخل هر سرویس رو خودت مشخص می‌کنی:
		if svc.Image != "" {
			appendMapField(sNode, "image", svc.Image)
		}
		if svc.ContainerName != "" {
			appendMapField(sNode, "container_name", svc.ContainerName)
		}
		if svc.Restart != "" {
			appendMapField(sNode, "restart", svc.Restart)
		}
		if svc.User != "" {
			appendMapField(sNode, "user", svc.User)
		}
		if len(svc.Ports) > 0 {
			appendMapField(sNode, "ports", svc.Ports)
		}
		if len(svc.Volumes) > 0 {
			appendMapField(sNode, "volumes", svc.Volumes)
		}
		if len(svc.DependsOn) > 0 {
			appendMapField(sNode, "depends_on", svc.DependsOn)
		}
		if len(svc.Environment) > 0 {
			appendMapField(sNode, "environment", svc.Environment)
		}

		// شبکه‌های داخلی سرویس
		if len(svc.Networks) > 0 {
			netNode := &yaml.Node{Kind: yaml.MappingNode}
			for _, n := range svc.Networks {
				if n.Ipv4Address == "" && n.Ipv6Address == "" && len(n.Aliases) == 0 {
					appendMapField(netNode, n.Name, struct{}{})
				} else {
					cfgNode := &yaml.Node{Kind: yaml.MappingNode}
					if n.Ipv4Address != "" {
						appendMapField(cfgNode, "ipv4_address", n.Ipv4Address)
					}
					if n.Ipv6Address != "" {
						appendMapField(cfgNode, "ipv6_address", n.Ipv6Address)
					}
					if len(n.Aliases) > 0 {
						appendMapField(cfgNode, "aliases", n.Aliases)
					}
					appendMapField(netNode, n.Name, cfgNode)
				}
			}
			appendMapField(sNode, "networks", netNode)
		}

		// بخش Healthcheck با استایل خطی [CMD, ...]
		if svc.Healthcheck != nil {
			hcNode := &yaml.Node{Kind: yaml.MappingNode}
			if len(svc.Healthcheck.Test) > 0 {
				testNode := &yaml.Node{Kind: yaml.SequenceNode, Style: yaml.FlowStyle}
				for _, t := range svc.Healthcheck.Test {
					testNode.Content = append(testNode.Content, &yaml.Node{Kind: yaml.ScalarNode, Value: t})
				}
				appendMapField(hcNode, "test", testNode)
			}
			if svc.Healthcheck.Interval != "" {
				appendMapField(hcNode, "interval", svc.Healthcheck.Interval)
			}
			if svc.Healthcheck.Timeout != "" {
				appendMapField(hcNode, "timeout", svc.Healthcheck.Timeout)
			}
			if svc.Healthcheck.Retries > 0 {
				appendMapField(hcNode, "retries", svc.Healthcheck.Retries)
			}
			appendMapField(sNode, "healthcheck", hcNode)
		}

		if svc.Logging != nil {
			logNode := &yaml.Node{Kind: yaml.MappingNode}
			if svc.Logging.Driver != "" {
				appendMapField(logNode, "driver", svc.Logging.Driver)
			}
			if len(svc.Logging.Options) > 0 {
				appendMapField(logNode, "options", svc.Logging.Options)
			}
			appendMapField(sNode, "logging", logNode)
		}

		// اضافه کردن این سرویس به نودِ کل سرویس‌ها
		appendMapField(servicesNode, svc.Name, sNode)
	}
	appendMapField(rootNode, "services", servicesNode)

	// ۳. شبکه‌های اصلی (Top-level Networks)
	if len(req.Networks) > 0 {
		networksNode := &yaml.Node{Kind: yaml.MappingNode}
		for _, net := range req.Networks {
			nNode := &yaml.Node{Kind: yaml.MappingNode}
			if net.Driver != "" {
				appendMapField(nNode, "driver", net.Driver)
			}
			if net.Internal {
				appendMapField(nNode, "internal", true)
			}
			if net.Ip != "" {
				ipamNode := &yaml.Node{Kind: yaml.MappingNode}
				configSlice := []map[string]interface{}{{"subnet": net.Ip}}
				appendMapField(ipamNode, "config", configSlice)
				appendMapField(nNode, "ipam", ipamNode)
			}
			appendMapField(networksNode, net.Name, nNode)
		}
		appendMapField(rootNode, "networks", networksNode)
	}

	// ۴. حجم‌های اصلی (Top-level Volumes)
	if len(req.Volumes) > 0 {
		volumesNode := &yaml.Node{Kind: yaml.MappingNode}
		for _, vol := range req.Volumes {
			appendMapField(volumesNode, vol.Name, struct{}{})
		}
		appendMapField(rootNode, "volumes", volumesNode)
	}

	// مارشال کردن نودِ ریشه
	return yaml.Marshal(rootNode)
}
