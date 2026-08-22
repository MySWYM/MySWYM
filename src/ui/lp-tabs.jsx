import { Tabs as TabsPrimitive } from "radix-ui";

export function Tabs({ className = "", ...props }) {
  return <TabsPrimitive.Root className={className} {...props} />;
}

export function TabsList({ className = "", ...props }) {
  return <TabsPrimitive.List className={className} {...props} />;
}

export function TabsTrigger({ className = "", ...props }) {
  return <TabsPrimitive.Trigger className={className} {...props} />;
}

export function TabsContent({ className = "", ...props }) {
  return <TabsPrimitive.Content className={className} {...props} />;
}
