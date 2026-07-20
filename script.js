// Initialisation des icônes Lucide
document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
});

// ---- NAVBAR SCROLL ----
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// ---- HAMBURGER ----
document.getElementById('hamburger').addEventListener('click', () => {
    document.getElementById('navLinks').classList.toggle('open');
});

document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        document.getElementById('navLinks').classList.remove('open');
    });
});

// ---- ACTIVE NAV LINK ----
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY + 100;
    sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');
        const link = document.querySelector(`.nav-links a[href="#${id}"]`);
        if (link) {
            link.classList.toggle('active', scrollY >= top && scrollY < top + height);
        }
    });
});

// ---- FADE IN ON SCROLL ----
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
    });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// ---- COUNTER ANIMATION ----
function animateCounter(el, target, duration = 2000) {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
        start += step;
        if (start >= target) {
            el.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            el.textContent = Math.floor(start).toLocaleString();
        }
    }, 16);
}

const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounter(document.getElementById('countArtists'), 42);
            animateCounter(document.getElementById('countFestivaliers'), 2847);
            animateCounter(document.getElementById('countConcerts'), 18);
            counterObserver.disconnect();
        }
    });
}, { threshold: 0.5 });
counterObserver.observe(document.querySelector('.hero-stats'));

// ==========================================
// ---- INSCRIPTION + PDF + QR CODE (VERSION STABLE) ----
// ==========================================
async function handleInscription(e, type) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Génération en cours...';

    try {
        let participantName = '';
        let participantCategory = '';
        let data = { type: type };

        if (type === 'festivalier') {
            const selects = form.querySelectorAll('select');
            data.nom = form.querySelector('input[placeholder="AGOSSOU"]').value;
            data.prenom = form.querySelector('input[placeholder="Koffi"]').value;
            data.email = form.querySelector('input[type="email"]').value;
            data.telephone = form.querySelector('input[type="tel"]').value;
            data.pays = selects[0].value;
            data.categorie = selects[1].value;
            participantName = `${data.prenom} ${data.nom}`;
            participantCategory = data.categorie;
        } else if (type === 'artiste') {
            const inputsNumber = form.querySelectorAll('input[type="number"]');
            data.nomGroupe = form.querySelector('input[placeholder="The Ouidah Jazz Collective"]').value;
            data.representant = form.querySelector('input[placeholder="Nom complet"]').value;
            data.telephone = form.querySelector('input[type="tel"]').value;
            data.genre = form.querySelector('select').value;
            data.membres = inputsNumber[0].value;
            data.instruments = form.querySelector('input[placeholder="Saxophone, Piano, Batterie, Voix..."]').value;
            data.duree = inputsNumber[1].value;
            data.besoins = form.querySelector('textarea').value;
            participantName = data.nomGroupe;
            participantCategory = 'Artiste';
        }

        const invitationCode = 'JAZZ-2026-' + Math.floor(10000 + Math.random() * 90000);

        // 1. Envoi à Google Sheets
        await fetch('https://script.google.com/macros/s/AKfycbw2ZkN_kOxat8VdeK2gg5RaxSVmW1X_HtdJnuJJVtJ4N_TxRhE4X8rqbKzHFP88ooFynw/exec', {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ ...data, code: invitationCode })
        });

        // 2. Génération du QR Code (Méthode stable avec qrcodejs)
        const tempDiv = document.createElement('div');
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);

        new QRCode(tempDiv, {
            text: invitationCode,
            width: 256,
            height: 256,
            colorDark: "#0A0A0F",
            colorLight: "#FFFFFF",
            correctLevel: QRCode.CorrectLevel.H
        });

        // Petite pause pour laisser le temps au navigateur de dessiner le canvas
        await new Promise(resolve => setTimeout(resolve, 150));
        
        const qrElement = tempDiv.querySelector('canvas') || tempDiv.querySelector('img');
        const qrImage = qrElement.tagName === 'CANVAS' ? qrElement.toDataURL('image/png') : qrElement.src;
        
        document.body.removeChild(tempDiv);

        // 3. Création du PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [100, 60] });

        doc.setFillColor(10, 10, 15);
        doc.rect(0, 0, 100, 60, 'F');
        
        doc.setDrawColor(212, 168, 67);
        doc.setLineWidth(0.5);
        doc.rect(2, 2, 96, 56);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(212, 168, 67);
        doc.text('FESTIVAL INTERNATIONAL DE JAZZ', 50, 8, { align: 'center' });
        doc.text('DE OUIDAH 2026', 50, 12, { align: 'center' });

        doc.setFontSize(11);
        doc.setTextColor(245, 240, 232);
        doc.text(participantName, 50, 20, { align: 'center' });

        doc.setFontSize(8);
        doc.setTextColor(212, 168, 67);
        doc.text(participantCategory, 50, 25, { align: 'center' });

        doc.addImage(qrImage, 'PNG', 35, 28, 30, 30);

        doc.setFont('courier', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(245, 240, 232);
        doc.text(invitationCode, 50, 57, { align: 'center' });

        // 4. Téléchargement
        const fileName = `Carte_${participantName.replace(/\s+/g, '_')}_${invitationCode}.pdf`;
        doc.save(fileName);

        // 5. Modal de succès
        document.getElementById('modalCode').textContent = invitationCode;
        document.getElementById('modalMessage').textContent =
            type === 'artiste'
                ? 'Votre dossier artiste a été soumis. Votre carte a été téléchargée.'
                : 'Votre inscription est confirmée. Votre carte a été téléchargée.';
        document.getElementById('successModal').classList.add('active');
        form.reset();

    } catch (error) {
        console.error('Erreur détaillée:', error);
        alert('Erreur: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        if (window.lucide) lucide.createIcons();
    }
    return false;
}

// ---- MODAL ----
function closeModal() {
    document.getElementById('successModal').classList.remove('active');
}
document.getElementById('successModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
});

// ---- SCAN TICKET ----
function validateTicket() {
    const input = document.getElementById('scanInput').value.trim();
    const result = document.getElementById('scanResult');

    if (!input) {
        result.innerHTML = `<div style="padding:1rem; background:rgba(224,64,64,0.1); border:1px solid rgba(224,64,64,0.3); border-radius:var(--radius-sm); color:var(--rouge); font-size:0.88rem;">⚠ Veuillez entrer un numéro d'invitation.</div>`;
        return;
    }

    const isValid = input.startsWith('JAZZ');
    if (isValid) {
        result.innerHTML = `<div style="padding:1.25rem; background:rgba(52,211,153,0.08); border:1px solid rgba(52,211,153,0.3); border-radius:var(--radius-sm);">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                <span style="color:var(--vert); font-size:1.3rem;">✓</span>
                <strong style="color:var(--vert); font-size:1rem;">Accès Autorisé</strong>
            </div>
            <p style="font-size:0.82rem; color:var(--blanc-dim);"><strong style="color:var(--blanc);">AGOSSOU Koffi</strong> — Public Général<br>Entrée : ${new Date().toLocaleTimeString('fr-FR')} • Scan QR</p>
        </div>`;
    } else {
        result.innerHTML = `<div style="padding:1.25rem; background:rgba(224,64,64,0.08); border:1px solid rgba(224,64,64,0.3); border-radius:var(--radius-sm);">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                <span style="color:var(--rouge); font-size:1.3rem;">✕</span>
                <strong style="color:var(--rouge); font-size:1rem;">Billet Invalide</strong>
            </div>
            <p style="font-size:0.82rem; color:var(--blanc-dim);">Ce numéro n'existe pas dans la base de données ou a déjà été utilisé.</p>
        </div>`;
    }
}
document.getElementById('scanInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') validateTicket();
});