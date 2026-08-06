import { Card } from "./card";
import { items } from "./data";

interface Props {
  onSelect: (id: string) => void;
}

export const List = ({ onSelect }: Props) => {
  return (
    <ul className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
      {items.map((card) => (
        <Card key={card.id} {...card} onSelect={onSelect} />
      ))}
    </ul>
  );
};
