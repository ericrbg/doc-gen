// Persistent expansion cookie for the file tree
// ---------------------------------------------

let expanded = {};
for (const e of (sessionStorage.getItem('expanded') || '').split(',')) {
  if (e !== '') {
    expanded[e] = true;
  }
}

function saveExpanded() {
  sessionStorage.setItem("expanded",
    Object.getOwnPropertyNames(expanded).filter((e) => expanded[e]).join(","));
}

for (const elem of document.getElementsByClassName('nav_sect')) {
  const id = elem.getAttribute('data-path');
  if (!id) continue;
  if (expanded[id]) {
    elem.open = true;
  }
  elem.addEventListener('toggle', () => {
    expanded[id] = elem.open;
    saveExpanded();
  });
}

for (const currentFileLink of document.getElementsByClassName('visible')) {
  setTimeout(() => currentFileLink.scrollIntoView(), 0);
}






// Expansion of implicit arguments ({...})
// ---------------------------------------


for (const impl_collapsed of document.getElementsByClassName('impl_collapsed')) {
    const impl_args = impl_collapsed.getElementsByClassName('impl_arg');
    if (impl_args.length > 0) {
        impl_args[0].addEventListener('click', () =>
            impl_collapsed.classList.remove('impl_collapsed'));
    }
}







// Tactic list tag filter
// ----------------------

function filterSelectionClass(tagNames, classname) {
    if (tagNames.length == 0) {
      for (const elem of document.getElementsByClassName(classname)) {
        elem.classList.remove("hide");
      }
    } else {
      // Add the "show" class (display:block) to the filtered elements, and remove the "show" class from the elements that are not selected
      for (const elem of document.getElementsByClassName(classname)) {
        elem.classList.add("hide");
        for (const tagName of tagNames) {
            if (elem.classList.contains(tagName)) {
              elem.classList.remove("hide");
            }
        }
      }
    }
  }

  function filterSelection(c) {
    filterSelectionClass(c, "tactic");
    filterSelectionClass(c, "taclink");
  }

var filterBoxes = document.getElementsByClassName("tagfilter");

function updateDisplay() {
    filterSelection(getSelectValues());
}

function getSelectValues() {
    var result = [];

    for (const opt of filterBoxes) {

      if (opt.checked) {
        result.push(opt.value);
      }
    }
    return result;
  }

function setSelectVal(val) {
  for (const opt of filterBoxes) {
    opt.checked = val;
  }
}

updateDisplay();

for (const opt of filterBoxes) {
  opt.addEventListener('change', updateDisplay);
}

const tse = document.getElementById("tagfilter-selectall")
if (tse != null) {
  tse.addEventListener('change', function() {
    setSelectVal(this.checked);
    updateDisplay();
  });
}




// Simple declaration search
// -------------------------

const searchWorkerURL = new URL(`${siteRoot}searchWorker.js`, window.location);
const declSearch = (q) => new Promise((resolve, reject) => {
  const worker = new SharedWorker(searchWorkerURL);
  worker.port.start();
  worker.port.onmessage = ({data}) => resolve(data);
  worker.port.onmessageerror = (e) => reject(e);
  worker.port.postMessage({q});
});

const srId = 'search_results';
document.getElementById('search_form')
  .appendChild(document.createElement('div'))
  .id = srId;

function goToDecl(d) { window.location.href = `${siteRoot}find/${d}`; }

function handleSearchCursorUpDown(down) {
  const sel = document.querySelector(`#${srId} .selected`);
  const sr = document.getElementById(srId);
  if (sel) {
    sel.classList.remove('selected');
    const toSelect = down ?
      sel.nextSibling || sr.firstChild:
      sel.previousSibling || sr.lastChild;
    toSelect && toSelect.classList.add('selected');
  } else {
    const toSelect = down ? sr.firstChild : sr.lastChild;
    toSelect && toSelect.classList.add('selected');
  }
}

function handleSearchEnter() {
  const sel = document.querySelector(`#${srId} .selected`)
    || document.getElementById(srId).firstChild;
  goToDecl(sel.innerText);
}

const searchInput = document.querySelector('#search_form input[name=q]');

searchInput.addEventListener('keydown', (ev) => {
  switch (ev.key) {
    case 'Down':
    case 'ArrowDown':
      ev.preventDefault();
      handleSearchCursorUpDown(true);
      break;
    case 'Up':
    case 'ArrowUp':
      ev.preventDefault();
      handleSearchCursorUpDown(false);
      break;
    case 'Enter':
      ev.preventDefault();
      handleSearchEnter();
      break;
  }
});

searchInput.addEventListener('input', async (ev) => {
  const text = ev.target.value;

  if (!text) {
    const sr = document.getElementById(srId);
    sr.removeAttribute('state');
    sr.replaceWith(sr.cloneNode(false));
    return;
  }

  document.getElementById(srId).setAttribute('state', 'loading');

  const result = await declSearch(text);
  if (ev.target.value != text) return;

  const oldSR = document.getElementById('search_results');
  const sr = oldSR.cloneNode(false);
  for (const {decl} of result) {
    const d = sr.appendChild(document.createElement('div'));
    d.innerText = decl;
    d.title = decl;
    d.onclick = () => goToDecl(decl);
  }
  sr.setAttribute('state', 'done');
  oldSR.replaceWith(sr);
});






// 404 page goodies
// ----------------

const howabout = document.getElementById('howabout');
if (howabout) {
  howabout.innerText = "Please wait a second.  I'll try to help you.";

  howabout.parentNode
      .insertBefore(document.createElement('pre'), howabout)
      .appendChild(document.createElement('code'))
      .innerText = window.location.href.replace(/[/]/g, '/\u200b');

  const query = window.location.href.match(/[/]([^/]+)(?:\.html|[/])?$/)[1];
  declSearch(query).then((results) => {
      howabout.innerText = 'How about one of these instead:';
      const ul = howabout.appendChild(document.createElement('ul'));
      for (const {decl} of results) {
          const li = ul.appendChild(document.createElement('li'));
          const a = li.appendChild(document.createElement('a'));
          a.href = `${siteRoot}find/${decl}`;
          a.appendChild(document.createElement('code')).innerText = decl;
      }
  });
}