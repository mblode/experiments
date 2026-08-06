import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ANSWER =
  "Aave is a decentralised non-custodial liquidity protocol where users can participate as suppliers or borrowers. Suppliers provide liquidity to the market while earning interest, and borrowers can access liquidity by providing collateral that exceeds the borrowed amount.";

const QUESTIONS = [
  { value: "item-1", question: "Is it accessible?" },
  { value: "item-2", question: "Is it fun?" },
  { value: "item-3", question: "Is it cool?" },
];

export const FaqBlock = () => {
  return (
    <Accordion collapsible type="single">
      {QUESTIONS.map(({ value, question }) => (
        <AccordionItem key={value} value={value}>
          <AccordionTrigger>
            <span className="font-semibold text-base tracking-tight">
              {question}
            </span>
          </AccordionTrigger>
          <AccordionContent>{ANSWER}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
