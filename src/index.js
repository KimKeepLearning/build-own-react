import { Didact } from "./didact";
/** @jsx Didact.createElement */
const element = (
  // eslint-disable-next-line
  <div style="background: salmon">
    <h1>Hello World</h1>
    <h2 style="text-align:right">from Didact</h2>
  </div>
);
const container = document.getElementById("root");
Didact.render(element, container);