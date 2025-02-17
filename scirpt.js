document.addEventListener('DOMContentLoaded', function () {
  // Sprawdź, czy użytkownik już widział wiadomość
  if (!localStorage.getItem('infoShown')) {
      // Pokaż wiadomość z animacją
      showInfo();
  } else {
      // Ukryj wiadomość, jeśli była już pokazana
      document.getElementById('i-a-respons').style.display = 'none';
  }
});

function showInfo() {
  const infoDiv = document.getElementById('i-a-respons');

  // Ustaw początkową pozycję poza ekranem (100%)
  infoDiv.style.transform = 'translateX(100%)';
  infoDiv.style.display = 'block';

  // Animacja przesunięcia do pozycji 0%
  setTimeout(() => {
      infoDiv.style.transition = 'transform 500ms ease-in-out';
      infoDiv.style.transform = 'translateX(0%)';
  }, 10); // Małe opóźnienie, aby przeglądarka mogła zarejestrować zmianę
}

function confirmInf() {
  // Zapisz stan, że wiadomość została pokazana
  localStorage.setItem('infoShown', 'true');

  // Ukryj wiadomość
  document.getElementById('i-a-respons').style.display = 'none';
}



// Funkcja do wysyłania opinii
function wyslijOpinie() {
  // Pobierz wartości z formularza
  const nick = document.getElementById('nick').value;
  const ocena = document.getElementById('ocena').value;
  const notka = document.getElementById('notka').value;

  // Sprawdź, czy wszystkie pola są wypełnione
  if (!nick || !ocena || !notka) {
      alert('Proszę wypełnić wszystkie pola!');
      return;
  }

  // Wyślij dane do webhooka Discord
  const webhookUrl = 'https://discord.com/api/webhooks/1207006608148795402/za7NVTnJFkpwW-BmOelM3DXzfoxq1GvAIWmNoZp0RT97A-Ac-hnRd8mCgcR83KCt9tSY';

  // Tworzenie embeda
  const embed = {
      title: "📝 Nowa opinia!",
      color: 0xFFA500, // Kolor pomarańczowy (możesz zmienić na inny)
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
      timestamp: new Date().toISOString(), // Dodaje znacznik czasu
      footer: {
          text: "System opinii"
      }
  };

  const message = {
      content: "📨 Nowa opinia została wysłana!", // Wiadomość nad embedem
      embeds: [embed] // Dodaj embed do wiadomości
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
  document.getElementById('nick').value = ''; // Czyści pole Nick
  document.getElementById('ocena').value = ''; // Ustawia select na domyślną opcję
  document.getElementById('notka').value = ''; // Czyści pole Notka
}


function noPages(event) {
    event.preventDefault(); // Zapobiega domyślnej akcji linku (przekierowaniu)
    const alertBox = document.getElementById('i-b-respons');
    const progressBar = document.getElementById('i7');

    // Resetujemy animację paska
    progressBar.style.animation = 'none';
    void progressBar.offsetHeight; // Wymuszenie przeładowania stylu
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

    // Ukrywamy alert z animacją
    alertBox.style.opacity = '0';
    alertBox.style.transform = 'translateX(120%)';

    // Resetujemy pasek postępu
    progressBar.style.animation = 'none';

    // Ukrywamy alert po zakończeniu animacji
    setTimeout(() => {
        alertBox.style.display = 'none';
        alertBox.style.opacity = '1';
    }, 500);
}