import { Accordion as AccordionPrimitive } from "radix-ui";

export function Accordion({ className = "", ...props }) {
  return <AccordionPrimitive.Root className={className} {...props} />;
}

export function AccordionItem({ className = "", ...props }) {
  return <AccordionPrimitive.Item className={className} {...props} />;
}

export function AccordionTrigger({ className = "", children, ...props }) {
  return (
    <AccordionPrimitive.Header className="lp-accordion-header">
      <AccordionPrimitive.Trigger className={className} {...props}>
        {children}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({ className = "", children, ...props }) {
  return (
    <AccordionPrimitive.Content className={`lp-accordion-content ${className}`.trim()} {...props}>
      <div className="lp-accordion-panel">{children}</div>
    </AccordionPrimitive.Content>
  );
}
