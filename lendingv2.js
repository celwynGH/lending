/*********************************
 * DATA STORAGE
 *********************************/
let editIndex = -1;
let loans = JSON.parse(localStorage.getItem("loans")) || [];

function saveLoans() {
  localStorage.setItem("loans", JSON.stringify(loans));
}


/*********************************
 * UTILITIES
 *********************************/
function peso(n) {
  return '₱' + n.toLocaleString();
}

function isOverdue(loan) {
  if (loan.paid || !loan.returnDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return new Date(loan.returnDate) < today;
}


/*********************************
 * RENDER UI
 *********************************/
function render() {
  const list = document.getElementById('loanList');
  const q = document.getElementById('search').value.toLowerCase();
  list.innerHTML = '';

  let total = 0, collect = 0, paid = 0, overdueTotal = 0;


  loans
    .filter(l => l.name.toLowerCase().includes(q))
    .forEach((l, i) => {

      const loanWithInterest =
    l.principal + (l.principal * l.interest / 100);

      const due =
    loanWithInterest - (l.initialPayment || 0);
      total += l.principal;
      if (l.paid) {
  paid++;
} else if (isOverdue(l)) {
  overdueTotal += due;
} else {
  collect += due;
}

      const badgeClass = l.paid
        ? 'paid'
        : isOverdue(l)
        ? 'overdue'
        : 'track';

      const badgeText = l.paid
        ? 'PAID'
        : isOverdue(l)
        ? 'OVERDUE'
        : 'ON TRACK';

      list.innerHTML += `
        <div class="loan">
          <div class="loan-header">
            <div>
              <div class="name">${l.name}</div>
              <div class="date">Loaned on ${l.date}</div>
              <span class="badge ${badgeClass}">${badgeText}</span>
            </div>
            <div class="actions">

<button onclick="editLoan(${i})">
Edit
</button>



</div>
              ${!l.paid ? `<button class="btn-success" onclick="markPaid(${i})">Paid</button>` : ''}
              <button class="btn-danger" onclick="removeLoan(${i})">Delete</button>
            </div>
          </div>

          <div class="loan-body">
            <div><div class="label">PRINCIPAL</div><div class="value">${peso(l.principal)}</div></div>
            <div><div class="label">INITIAL PAYMENT</div><div class="value">${peso(l.initialPayment||0)}</div></div>
            <div><div class="label">INTEREST</div><div class="value">${l.interest}%</div></div>
            <div><div class="label">TOTAL DUE</div><div class="value" style="color:var(--success)">${peso(due)}</div></div>
            <div><div class="label">TERM</div><div class="value">${l.term}</div></div>
          </div>

          <div class="loan-footer">
            Return Date: ${l.returnDate || '—'}
          </div>
        </div>`;
    });

  document.getElementById('totalLent').textContent = peso(total);
  document.getElementById('toCollect').textContent = peso(collect);
  document.getElementById('overdue').textContent = peso(overdueTotal);
  document.getElementById('paidCount').textContent = paid;

}


/*********************************
 * ACTIONS
 *********************************/
function markPaid(i) {
  loans[i].paid = true;
  saveLoans();
  render();
}

function removeLoan(i) {
  if (confirm('Delete this loan?')) {
    loans.splice(i, 1);
    saveLoans();
    render();
  }
}


/*********************************
 * MODAL CONTROLS
 *********************************/
function openModal(isEdit = false) {

    if (!isEdit) {
        editIndex = -1;

        document.querySelector(".btn-dark").textContent = "Add Loan";

        m_name.value = "";
        m_principal.value = "";
        m_initialPayment.value = 0;
        m_interest.value = "";
        m_termValue.value = "";
        m_termUnit.value = "month";
        m_returnDate.value = "";

        m_loanDate.value = new Date().toISOString().slice(0,10);
    }

    document.getElementById("loanModal").classList.remove("hidden");
}

function closeModal() {
    document.getElementById("loanModal").classList.add("hidden");

    // Reset edit mode
    editIndex = -1;

    // Restore button text
    document.querySelector(".btn-dark").textContent = "Add Loan";
}


/*********************************
 * DATE CALCULATION
 *********************************/
function calculateReturnDate(start, value, unit) {
  const d = new Date(start);
  if (unit === 'week') d.setDate(d.getDate() + value * 7);
  if (unit === 'month') d.setMonth(d.getMonth() + value);
  return d.toISOString().slice(0, 10);
}

function updateReturn() {
  const start = m_loanDate.value;
  const val = Number(m_termValue.value);
  const unit = m_termUnit.value;

  if (start && val) {
    m_returnDate.value = calculateReturnDate(start, val, unit);
  }
}

m_termValue.addEventListener('input', updateReturn);
m_termUnit.addEventListener('change', updateReturn);
m_loanDate.addEventListener('change', updateReturn);


/*********************************
 * SUBMIT LOAN
 *********************************/
function submitLoan(){

    const loan = {

        id: editIndex == -1 ? Date.now() : loans[editIndex].id,

        name: m_name.value.trim(),

        principal: Number(m_principal.value),

        initialPayment: Number(m_initialPayment.value) || 0,

        interest: Number(m_interest.value),

        term: `${m_termValue.value} ${m_termUnit.value}`,

        date: m_loanDate.value,

        returnDate: m_returnDate.value,

        paid: editIndex == -1 ? false : loans[editIndex].paid
    };

    if(editIndex === -1){
        loans.push(loan);
    }else{
        loans[editIndex] = loan;
    }

    saveLoans();
    closeModal();
    render();
}

/*********************************
 * EDIT LOAN
 *********************************/
function editLoan(i){

    editIndex = i;

    const l = loans[i];

    openModal(true);

    m_name.value = l.name;
    m_principal.value = l.principal;
    m_initialPayment.value = l.initialPayment || 0;
    m_interest.value = l.interest;

    m_loanDate.value = l.date;

    const term = l.term.split(" ");

    m_termValue.value = term[0];
    m_termUnit.value = term[1];

    m_returnDate.value = l.returnDate;

    document.querySelector(".btn-dark").textContent = "Save Changes";
}





/*********************************
 * OVERDUE ALERT
 *********************************/
function dueDateAlerts() {
  const today = new Date().setHours(0, 0, 0, 0);

  const overdueLoans = loans.filter(l =>
    !l.paid &&
    l.returnDate &&
    new Date(l.returnDate) < today
  );

  if (overdueLoans.length) {
    alert(
      `⚠ OVERDUE LOANS:\n\n` +
      overdueLoans.map(l =>
        `${l.name} (Due: ${l.returnDate})`
      ).join("\n")
    );
  }
}


/*********************************
 * INITIAL LOAD
 *********************************/
render();
dueDateAlerts();
