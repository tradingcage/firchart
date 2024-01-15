export function createFormFromObject(elem, obj, callback) {
  // Create the form element
  var form = document.createElement("form");
  form.style.textAlign = "left";
  form.style.marginTop = "1em";
  form.style.fontSize = "1rem";

  // Function to gather form data and call the callback
  function gatherDataAndCallCallback() {
    var formData = {};
    for (var i = 0; i < form.elements.length; i++) {
      var formElement = form.elements[i];
      if (formElement.name) {
        var value = formElement.value;
        if (formElement.type === "number") {
          value = Number(value);
        }
        formData[formElement.name] = value;
      }
    }
    callback(formData);
  }

  // Iterate over each property in the object
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      // Create a container for each row
      var row = document.createElement("div");
      row.style.marginBottom = "10px";
      row.style.marginLeft = "0.5em";

      // Create a label for the input
      var label = document.createElement("label");
      label.textContent = key + ": ";
      label.style.marginRight = "10px";
      label.style.display = "inline-block";
      label.style.width = "100px";

      // Create the input element
      var input = document.createElement("input");
      input.name = key;
      input.value = obj[key];

      const styleInput = () => {
        input.style.padding = "0.1rem 0.2rem 0.1em 0.2em";
        input.style.border = "1px solid gray";
        input.style.borderRadius = "3px";
      };

      // Determine the type of the input
      if (typeof obj[key] === "string") {
        if (obj[key].startsWith("#")) {
          input.type = "color";
        } else {
          styleInput();
          input.type = "text";
        }
      } else if (typeof obj[key] === "number") {
        styleInput();
        input.type = "number";
      }

      // Add blur event listener to call callback when input loses focus
      input.addEventListener("blur", gatherDataAndCallCallback);

      // Append the label and input to the row
      row.appendChild(label);
      row.appendChild(input);

      // Append the row to the form
      form.appendChild(row);
    }
  }

  elem.appendChild(form);
}

export function createPopup(titleText, container) {
  const popupContainer = document.createElement("div");
  popupContainer.style.position = "absolute";
  popupContainer.style.backgroundColor = "rgba(238, 238, 238, 0.5)";
  popupContainer.style.width = "100%";
  popupContainer.style.height = "100%";
  popupContainer.style.display = "none";
  popupContainer.style.userSelect = "none";
  popupContainer.style.zIndex = "1";

  popupContainer.onclick = function (e) {
    if (e.target === popupContainer) {
      popupContainer.style.display = "none";
    }
  };

  const popup = document.createElement("div");
  popup.style.width = "400px";
  popup.style.margin = "100px auto";
  popup.style.backgroundColor = "#fff";
  popup.style.position = "relative";
  popup.style.padding = "15px";
  popup.style.boxShadow = "0px 0px 10px rgba(0,0,0,0.5)";

  const title = document.createElement("div");
  title.innerHTML = titleText;
  title.style.fontSize = "1.5rem";
  title.style.padding = "5px";

  const updateTitle = (newTitle) => {
    title.innerHTML = newTitle;
  };

  const contents = document.createElement("div");

  const closeButton = document.createElement("div");
  closeButton.innerHTML = iconoirXmarkSvg;
  closeButton.style.position = "absolute";
  closeButton.style.top = "20px";
  closeButton.style.right = "15px";
  closeButton.style.cursor = "pointer";

  const hidePopup = function () {
    popupContainer.style.display = "none";
  };
  closeButton.onclick = hidePopup;

  popup.appendChild(title);
  popup.appendChild(closeButton);
  popup.appendChild(contents);
  popupContainer.appendChild(popup);

  container.appendChild(popupContainer);

  return [
    popupContainer,
    contents,
    () => {
      popupContainer.style.display = "block";
    },
    updateTitle,
  ];
}
