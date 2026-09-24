import { ANIMALS, ANIMAL_ORDER } from "../data/animals";

export function AnimalCollection({ found }) {
  return (
    <div className="collection">
      {ANIMAL_ORDER.map((id) => {
        const animal = ANIMALS[id];
        const isFound = found.has(id);
        return (
          <div key={id} className={`collection-item${isFound ? " collection-item-found" : ""}`}>
            <span className="collection-emoji">{isFound ? animal.emoji : "❓"}</span>
            <span className="collection-name">{isFound ? animal.name : "?"}</span>
          </div>
        );
      })}
    </div>
  );
}
