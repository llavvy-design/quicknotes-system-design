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

function setButtonsDisabled(disabled) {
  loadButton.disabled = disabled;
  submitButton.disabled = disabled;

  const deleteButtons = notesList.querySelectorAll(".delete-btn");

  deleteButtons.forEach((button) => {
    button.disabled = disabled;
  });
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

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.classList.add("delete-btn");
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute(
      "aria-label",
      `Delete note: ${note.title}`
    );

    deleteButton.addEventListener("click", () => {
      deleteNote(note.id);
    });

    noteItem.appendChild(title);
    noteItem.appendChild(body);
    noteItem.appendChild(deleteButton);

    notesList.appendChild(noteItem);
  });
}


async function loadNotes() {
  setButtonsDisabled(true);
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
    setButtonsDisabled(false);
  }
}


async function createNote(title, body) {
  setButtonsDisabled(true);
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
    setButtonsDisabled(false);
  }
}

async function deleteNote(noteId) {
  setButtonsDisabled(true);
  setStatus(`Deleting note #${noteId}...`);

  try {
    const result = await request(`${API_URL}/${noteId}`, {
      method: "DELETE"
    });

    notes = notes.filter(
      (note) => String(note.id) !== String(noteId)
    );

    renderNotes(notes);

    setStatus(
      `Note deleted (status ${result.status}, id ${noteId}).`,
      "success"
    );
  } catch (error) {
    setStatus(
      `Could not delete note #${noteId}. Please try again.`,
      "error"
    );

    console.error("Delete note error:", error);
  } finally {
    setButtonsDisabled(false);
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