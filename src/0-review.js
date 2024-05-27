const element = {
  type: "h1",
  props: {
    title: "foo",
    children: "hello",
  }
}

const container = document.getElementById("root");


// 下面替代 ReactDOM.render(element, container);

const node = document.creatElement(element.type);
node['title'] = node.props.title;

const text = document.createTextNode('');
text['nodeValue'] = element.props.children;

node.appendChild(text);
container.appendChild(node);