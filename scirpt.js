document.addEventListener('DOMContentLoaded', function () {
  if (!localStorage.getItem('infoShown')) {
      showInfo();
  } else {
      document.getElementById('i-a-respons').style.display = 'none';
  }
});

function showInfo() {
  const infoDiv = document.getElementById('i-a-respons');

  infoDiv.style.transform = 'translateX(100%)';
  infoDiv.style.display = 'block';

  setTimeout(() => {
      infoDiv.style.transition = 'transform 500ms ease-in-out';
      infoDiv.style.transform = 'translateX(0%)';
  }, 10);
}

function confirmInf() {
  localStorage.setItem('infoShown', 'true');

  document.getElementById('i-a-respons').style.display = 'none';
}



function wyslijOpinie() {
  const nick = document.getElementById('nick').value;
  const ocena = document.getElementById('ocena').value;
  const notka = document.getElementById('notka').value;

  if (!nick || !ocena || !notka) {
      alert('Proszę wypełnić wszystkie pola!');
      return;
  }

  const webhookUrl = 'https://discord.com/api/webhooks/1207006608148795402/za7NVTnJFkpwW-BmOelM3DXzfoxq1GvAIWmNoZp0RT97A-Ac-hnRd8mCgcR83KCt9tSY';

  const embed = {
      title: "📝 Nowa opinia!",
      color: 0xFFA500,
      fields: [
          {
              name: "👤 Nick",
              value: nick,
              inline: true
          },
          {
              name: "⭐ Ocena",
              value: ocena,
              inline: true
          },
          {
              name: "📄 Notka",
              value: notka
          }
      ],
      timestamp: new Date().toISOString(),
      footer: {
          text: "System opinii"
      }
  };

  const message = {
      content: "📨 Nowa opinia została wysłana!",
      embeds: [embed]
  };

  fetch(webhookUrl, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
  })
      .then(response => {
          if (response.ok) {
              alert('Opinia wysłana pomyślnie!');

              // Wyczyść pola formularza
              wyczyscFormularz();
          } else {
              alert('Wystąpił błąd podczas wysyłania opinii.');
          }
      })
      .catch(error => {
          console.error('Błąd:', error);
          alert('Wystąpił błąd podczas wysyłania opinii.');
      });
}

// Funkcja do czyszczenia pól formularza
function wyczyscFormularz() {
  document.getElementById('nick').value = '';
  document.getElementById('ocena').value = '';
  document.getElementById('notka').value = '';
}


function noPages(event) {
    event.preventDefault();
    const alertBox = document.getElementById('i-b-respons');
    const progressBar = document.getElementById('i7');

    // Resetujemy animację paska
    progressBar.style.animation = 'none';
    void progressBar.offsetHeight;
    progressBar.style.animation = null;

    // Pokazujemy alert
    alertBox.style.display = 'block';
    setTimeout(() => {
        alertBox.style.transform = 'translateX(0)';
    }, 10);

    // Automatyczne ukrycie alertu po 5 sekundach
    setTimeout(() => {
        confirmInftwo();
    }, 5000);
}

function confirmInftwo() {
    const alertBox = document.getElementById('i-b-respons');
    const progressBar = document.getElementById('i7');

    alertBox.style.opacity = '0';
    alertBox.style.transform = 'translateX(120%)';

    progressBar.style.animation = 'none';

    // Ukrywamy alert po zakończeniu animacji
    setTimeout(() => {
        alertBox.style.display = 'none';
        alertBox.style.opacity = '1';
    }, 500);
}
