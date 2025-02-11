import { useState } from "react";
import recipes from "./recipes";

const categories = ["Breakfast", "Lunch", "Dinner", "Dessert", "Snacks"];

export default function Cookbook() {
  const [selectedCategory, setSelectedCategory] = useState("Breakfast");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRecipes = recipes.filter(
    (recipe) =>
      recipe.category === selectedCategory &&
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Cookbook</h1>
      
      <div className="flex space-x-2 mb-4">
        {categories.map((category) => (
          <button
            key={category}
            className={`px-3 py-1 rounded ${
              selectedCategory === category ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Search recipes..."
        className="w-full p-2 border rounded mb-4"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <ul>
        {filteredRecipes.map((recipe) => (
          <li key={recipe.name} className="mb-2">
            <a
              href={recipe.link}
              className="text-blue-500 hover:underline"
            >
              {recipe.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
