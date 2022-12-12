import { appendChild } from "hyplate/core";
import { For } from "hyplate/directive";
import { jsxRef } from "hyplate/jsx-runtime";
import { source } from "hyplate/store";
import { Source } from "hyplate/types";

interface ListItem {
  id: number;
  label: Source<string>;
}

const App = () => {
  const list = source<ListItem[]>([]);
  let id = 0;
  const createItem = (label: string): ListItem => {
    id++;
    return {
      id,
      label: source(label),
    };
  };
  console.log("This function will only be executed once on `App` attach.");
  const addRow = () => {
    const currentItems = list.val;
    const newList = currentItems.concat(createItem("new item"));
    list.set(newList);
  };
  return (
    <div class="app">
      <link rel="stylesheet" href="./index.css"></link>
      <img src="./logo.svg" class="logo"></img>
      <div>Hello, hyplate!</div>
      <div>
        <button onClick={addRow}>add row</button>
      </div>
      <div class="list">
        <For of={list}>
          {(item) => {
            console.log("This function will only be executed when a new list item is created.");
            // Feel free to get the DOM by `jsxRef`.
            const inputRef = jsxRef<HTMLInputElement>();
            const changeLabel = () => {
              item.label.set(inputRef.el.value);
            };
            const remove = () => {
              const newList = list.val.filter((it) => it !== item);
              list.set(newList);
            };
            const moveUp = () => {
              const newList = list.val.slice();
              const oldIndex = newList.indexOf(item);
              if (oldIndex === 0) {
                // Cannot move up if it's the first element.
                return;
              }
              [newList[oldIndex - 1], newList[oldIndex]] = [item, newList[oldIndex - 1]];
              list.set(newList);
            };
            const moveDown = () => {
              const newList = list.val.slice();
              const oldIndex = newList.indexOf(item);
              if (oldIndex === newList.length - 1) {
                // Cannot move down if it's the last element.
                return;
              }
              [newList[oldIndex], newList[oldIndex + 1]] = [newList[oldIndex + 1], item];
              list.set(newList);
            };
            return (
              <div class="list-item">
                <div class="row">
                  item {item.id} label: <span class="label">{item.label}</span>
                </div>
                <div class="row">
                  <input ref={inputRef}></input>
                  <button onClick={changeLabel}>change label</button>
                </div>
                <div class="row">
                  <button onClick={remove}>remove</button>
                  <button onClick={moveUp}>move up</button>
                  <button onClick={moveDown}>move down</button>
                </div>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
};

(<App />)(appendChild(document.body));
