const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadButton = document.querySelector("#load-btn");
const statusText = document.querySelector("#status");
const notesList = document.querySelector("#notes-list");
const noteForm = document.querySelector("#note-form");
const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const submitButton = document.querySelector("#submit-btn");


let notes = [];

function setStatus(message, type = "") {
  statusText.textContent = message;

  statusText.classList.remove(
    "status-success",
    "status-error"
  );

  if (type === "success") {
    statusText.classList.add("status-success");
  } else if (type === "error") {
    statusText.classList.add("status-error");
  }
}

async function request(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(
      `Request failed with status ${response.status}`
    );
  }

  const responseText = await response.text();

  let data = null;

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error("The server returned invalid JSON.");
    }
  }

  return {
    data: data,
    status: response.status
  };
}


function renderNotes(notesToRender) {
  notesList.replaceChildren();

  if (notesToRender.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.textContent = "No notes found.";
    notesList.appendChild(emptyMessage);
    return;
  }

  notesToRender.forEach((note) => {
    const noteItem = document.createElement("li");
    noteItem.classList.add("note-card");

    const title = document.createElement("h3");
    title.textContent = note.title;

    const body = document.createElement("p");
    body.textContent = note.body || "No body provided.";

    noteItem.appendChild(title);
    noteItem.appendChild(body);

    notesList.appendChild(noteItem);
  });
}


async function loadNotes() {
  loadButton.disabled = true;
  submitButton.disabled = true;

  setStatus("Loading notes...");
  notesList.replaceChildren();

  try {
    const result = await request(`${API_URL}?_limit=10`);

    notes = Array.isArray(result.data) ? result.data : [];

    renderNotes(notes);

    if (notes.length === 0) {
      setStatus(
        "No notes were returned by the server.",
        "success"
      );
    } else {
      setStatus(
        `Loaded ${notes.length} notes from the server.`,
        "success"
      );
    }
  } catch (error) {
    setStatus(
      "Could not load notes. Please try again.",
      "error"
    );

    console.error("Load notes error:", error);
  } finally {
    loadButton.disabled = false;
    submitButton.disabled = false;
  }
}


async function createNote(title, body) {
  loadButton.disabled = true;
  submitButton.disabled = true;

  setStatus("Creating note...");

  try {
    const result = await request(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: title,
        body: body,
        userId: 1
      })
    });

    const createdNote = result.data;

    notes = [createdNote, ...notes];

    renderNotes(notes);

    setStatus(
      `Note created (status ${result.status}, id ${createdNote.id}).`,
      "success"
    );

    noteForm.reset();
    titleInput.focus();
  } catch (error) {
    setStatus(
      "Could not create the note. Please try again.",
      "error"
    );

    console.error("Create note error:", error);
  } finally {
    loadButton.disabled = false;
    submitButton.disabled = false;
  }
}


loadButton.addEventListener("click", loadNotes);


noteForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (title === "") {
    setStatus("Please enter a title.", "error");
    titleInput.focus();
    return;
  }

  if (title.length > 100) {
    setStatus(
      "The title must not exceed 100 characters.",
      "error"
    );

    titleInput.focus();
    return;
  }

  createNote(title, body);
});