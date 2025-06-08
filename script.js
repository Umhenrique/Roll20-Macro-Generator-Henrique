var macroName = document.getElementsByName('macro-name')[0];
var macroAttribute = document.getElementsByName('macro-attribute')[0];
var macroImg = document.getElementsByName('macro-img-gif')[0];
var macroCriticalRange = document.getElementsByName('macro-critical-range')[0];
var macroDamage = document.getElementsByName('macro-damage')[0];
var macroCritical = document.getElementsByName('macro-critical')[0];
var macroProficiency = document.getElementsByName('macro-pb')[0];
var macroAttkQtd = document.getElementsByName('macro-attk-qtd')[0];
var macroGlobalAttack = document.getElementsByName('macro-global-attk-mod')[0];
var macroGlobalDamage = document.getElementsByName('macro-global-dmg-mod')[0];
var macroEffectType = document.getElementsByName('macro-effect-type')[0];
var macroEffectColor = document.getElementsByName('macro-effect-color')[0];

var macroPreviewName = document.querySelector('#macro-preview-name');
var macroPreviewImg = document.querySelector('#macro-preview-img');

var macroOutput = document.getElementById('macro-output-textarea');

// Cache DOM elements
const elements = {
	form: document.getElementById('macro-form'),
	savedMacros: document.getElementById('saved-macros'),
	saveMacroBtn: document.getElementById('save-macro-btn'),
	deleteMacroBtn: document.getElementById('delete-macro-btn'),
	macroOutput: document.getElementById('macro-output-textarea'),
	macroPreviewName: document.querySelector('#macro-preview-name'),
	macroPreviewImg: document.querySelector('#macro-preview-img'),
	macroPreviewAttackType: document.querySelector('#macro-preview-attack-type'),
	macroPreviewDamageType: document.querySelector('#macro-preview-damage-type'),
	square: document.getElementById('macro-preview-square'),
	row: document.getElementsByClassName('complete-attack-row')[0]
};

// Input validation patterns
const validationPatterns = {
	damage: /^\d+d\d+(\+\d+)?$/,
	image: /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i
};

// Debounce function for performance
function debounce(func, wait) {
	let timeout;
	return function executedFunction(...args) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}

// Validate input
function validateInput(input, pattern) {
	const errorDiv = input.parentElement.querySelector('.error-message') || 
					(() => {
						const div = document.createElement('div');
						div.className = 'error-message';
						input.parentElement.appendChild(div);
						return div;
					})();

	if (!pattern.test(input.value)) {
		errorDiv.style.display = 'block';
		errorDiv.textContent = `Invalid format. Please enter a valid value.`;
		return false;
	}
	errorDiv.style.display = 'none';
	return true;
}

// Save macro to localStorage
function saveMacro() {
	const macroName = document.getElementsByName('macro-name')[0].value;
	if (!macroName) {
		alert('Please enter a name for the macro');
		return;
	}

	const formData = new FormData(elements.form);
	const macroData = {};
	for (let [key, value] of formData.entries()) {
		macroData[key] = value;
	}

	const savedMacros = JSON.parse(localStorage.getItem('savedMacros') || '{}');
	savedMacros[macroName] = macroData;
	localStorage.setItem('savedMacros', JSON.stringify(savedMacros));
	updateSavedMacrosList();
}

// Load macro from localStorage
function loadMacro(macroName) {
	const savedMacros = JSON.parse(localStorage.getItem('savedMacros') || '{}');
	const macroData = savedMacros[macroName];
	if (!macroData) return;

	// Reset form first
	elements.form.reset();

	// Load all form values
	for (let [key, value] of Object.entries(macroData)) {
		const input = elements.form.querySelector(`[name="${key}"]`);
		if (input) {
			if (input.type === 'checkbox') {
				input.checked = value === 'on';
			} else {
				input.value = value;
			}
		}
	}

	// Update preview name
	const macroNameInput = document.getElementsByName('macro-name')[0];
	if (macroNameInput.value) {
		elements.macroPreviewName.textContent = macroNameInput.value;
	}

	// Update preview image
	const macroImgInput = document.getElementsByName('macro-img-gif')[0];
	if (macroImgInput.value) {
		elements.macroPreviewImg.src = macroImgInput.value;
	}

	// Update attack and damage types
	const attackType = document.getElementsByName('macro-attack-type')[0];
	const damageType = document.getElementsByName('macro-damage-type')[0];
	
	if (attackType.selectedIndex > 0) {
		elements.macroPreviewAttackType.textContent = attackType.value;
	}
	
	if (damageType.selectedIndex > 0) {
		elements.macroPreviewDamageType.textContent = damageType.value;
	}

	// Update attack rows
	const attkQtd = document.getElementsByName('macro-attk-qtd')[0].value;
	const currentAttksQtd = document.getElementsByClassName('complete-attack-row').length;
	const difference = attkQtd - currentAttksQtd;

	if (difference > 0) {
		for (let i = 0; i < difference; i++) {
			const newRow = document.createElement('div');
			newRow.className = 'complete-attack-row';
			newRow.innerHTML = elements.row.innerHTML;
			elements.square.appendChild(newRow);
		}
	} else if (difference < 0) {
		const currentAttks = elements.square.querySelectorAll('.complete-attack-row');
		for (let i = currentAttksQtd - 1; i >= attkQtd; i--) {
			elements.square.removeChild(currentAttks[i]);
		}
	}

	// Generate macro and update preview
	genMacro();
	updatePreviewValues();

	// Validate inputs
	const damageInput = document.getElementsByName('macro-damage')[0];
	const criticalInput = document.getElementsByName('macro-critical')[0];
	const imageInput = document.getElementsByName('macro-img-gif')[0];

	validateInput(damageInput, validationPatterns.damage);
	validateInput(criticalInput, validationPatterns.damage);
	validateInput(imageInput, validationPatterns.image);
}

// Delete macro from localStorage
function deleteMacro() {
	const macroName = elements.savedMacros.value;
	if (!macroName) return;

	const savedMacros = JSON.parse(localStorage.getItem('savedMacros') || '{}');
	delete savedMacros[macroName];
	localStorage.setItem('savedMacros', JSON.stringify(savedMacros));
	updateSavedMacrosList();
}

// Update saved macros dropdown
function updateSavedMacrosList() {
	const savedMacros = JSON.parse(localStorage.getItem('savedMacros') || '{}');
	elements.savedMacros.innerHTML = '<option value="">Select a saved macro</option>';
	for (let name in savedMacros) {
		const option = document.createElement('option');
		option.value = name;
		option.textContent = name;
		elements.savedMacros.appendChild(option);
	}
}

// Clear form
function clearForm() {
	elements.form.reset();
	elements.macroOutput.value = '';
	elements.macroPreviewName.textContent = '';
	elements.macroPreviewImg.src = '';
	updatePreviewValues();
}

// Initialize event listeners
function initializeEventListeners() {
	// Save/Load functionality
	elements.saveMacroBtn.addEventListener('click', saveMacro);
	elements.deleteMacroBtn.addEventListener('click', deleteMacro);
	elements.savedMacros.addEventListener('change', (e) => loadMacro(e.target.value));

	// Input validation
	const damageInput = document.getElementsByName('macro-damage')[0];
	const criticalInput = document.getElementsByName('macro-critical')[0];
	const imageInput = document.getElementsByName('macro-img-gif')[0];

	damageInput.addEventListener('input', debounce(() => {
		validateInput(damageInput, validationPatterns.damage);
	}, 300));

	criticalInput.addEventListener('input', debounce(() => {
		validateInput(criticalInput, validationPatterns.damage);
	}, 300));

	imageInput.addEventListener('input', debounce(() => {
		validateInput(imageInput, validationPatterns.image);
	}, 300));

	// Form inputs with debounced updates
	const debouncedGenMacro = debounce(genMacro, 300);
	const debouncedUpdatePreview = debounce(updatePreviewValues, 300);

	elements.form.querySelectorAll('input, select').forEach(input => {
		input.addEventListener('change', () => {
			debouncedGenMacro();
			debouncedUpdatePreview();
		});
		input.addEventListener('input', () => {
			debouncedGenMacro();
			debouncedUpdatePreview();
		});
	});
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
	initializeEventListeners();
	updateSavedMacrosList();
	genMacro();
	updatePreviewValues();
	if (macroImg.value != '') {
		elements.macroPreviewImg.src = macroImg.value;
	}
});

// Function to update preview values
function updatePreviewValues() {
	const attackRows = document.querySelectorAll('.macro-preview-row-roll');
	const attribute = macroAttribute.selectedIndex > 0 ? `+@{${macroAttribute.value.toLowerCase()}_mod}` : '';
	const proficiency = macroProficiency.checked ? '+@{pb}' : '';
	const globalAttack = macroGlobalAttack.checked ? '+@{global_attack_mod}' : '';
	const globalDamage = macroGlobalDamage.checked ? '+@{global_damage_mod_roll}' : '';

	// Update attack and damage types
	const attackType = document.getElementsByName('macro-attack-type')[0];
	const damageType = document.getElementsByName('macro-damage-type')[0];
	
	if (attackType.selectedIndex > 0) {
		elements.macroPreviewAttackType.textContent = attackType.value;
	} else {
		elements.macroPreviewAttackType.textContent = '';
	}
	
	if (damageType.selectedIndex > 0) {
		elements.macroPreviewDamageType.textContent = damageType.value;
	} else {
		elements.macroPreviewDamageType.textContent = '';
	}

	// Get current damage and critical values
	const damageValue = document.getElementsByName('macro-damage')[0].value;
	const criticalValue = document.getElementsByName('macro-critical')[0].value;

	// Update each attack row
	for (let i = 0; i < attackRows.length; i += 2) {
		// Attack roll - show just the d20
		attackRows[i].querySelector('p').textContent = '10';
		// Advantage roll - show just the d20
		attackRows[i + 1].querySelector('p').textContent = '20';
	}

	// Update damage and critical in the last row
	const lastRow = document.querySelector('.macro-preview-row-2');
	if (lastRow) {
		const damageRoll = lastRow.querySelectorAll('.macro-preview-row-roll')[0];
		const criticalRoll = lastRow.querySelectorAll('.macro-preview-row-roll')[1];
		if (damageRoll) {
			damageRoll.querySelector('p').textContent = damageValue;
		}
		if (criticalRoll) {
			criticalRoll.querySelector('p').textContent = criticalValue;
		}
	}
}

// Update the preview name
macroName.addEventListener('input', function(){
	if(macroName.value != ''){
		macroPreviewName.innerHTML = macroName.value;
	}
	genMacro();
	updatePreviewValues();
})

// Update the preview image/gif 
macroImg.addEventListener('input', function(){
	if(macroImg.value != ''){
		macroPreviewImg.src = macroImg.value;
	}
	genMacro();
	updatePreviewValues();
})

// Update the number of attaks in preview
var square = document.getElementById('macro-preview-square');
var row = document.getElementsByClassName('complete-attack-row')[0];
macroAttkQtd.addEventListener('input', function(){
	let attkQtd = macroAttkQtd.value;
	let currentAttksQtd = document.getElementsByClassName('complete-attack-row').length;
	let difference = attkQtd - currentAttksQtd;
	console.log(difference);
	if(difference > 0){
		let newRow = document.createElement('div');
		newRow.className = 'complete-attack-row';
		newRow.innerHTML = row.innerHTML
		square.appendChild(newRow);
	}
	if (difference < 0) {
		var currentAttks = square.querySelectorAll('.complete-attack-row');
		for(let i = currentAttksQtd - 1; i >= attkQtd; i--){
			square.removeChild(currentAttks[i]);
		}
	}
	genMacro();
	updatePreviewValues();
});

// Add event listeners for all other inputs
macroAttribute.addEventListener('change', function() {
	genMacro();
	updatePreviewValues();
});
macroCriticalRange.addEventListener('input', function() {
	genMacro();
	updatePreviewValues();
});
macroDamage.addEventListener('input', function() {
	genMacro();
	updatePreviewValues();
});
macroCritical.addEventListener('input', function() {
	genMacro();
	updatePreviewValues();
});
macroProficiency.addEventListener('change', function() {
	genMacro();
	updatePreviewValues();
});
macroGlobalAttack.addEventListener('change', function() {
	genMacro();
	updatePreviewValues();
});
macroGlobalDamage.addEventListener('change', function() {
	genMacro();
	updatePreviewValues();
});
macroEffectType.addEventListener('change', genMacro);
macroEffectColor.addEventListener('change', genMacro);

// Call updatePreviewValues on initial load
updatePreviewValues();
genMacro();

// Update preview image on load
if (macroImg.value != '') {
    macroPreviewImg.src = macroImg.value;
}

// Theme mode
var themeMode = document.getElementsByName('theme-mode')[0];
var macroInfo = document.getElementById('macro-info');
var macroPreview = document.getElementById('macro-preview');
var themeModeIcon = document.getElementById('theme-mode-icon');
var macroPreviewSquare = document.getElementById('macro-preview-square');
var macroPreviewRow1 = document.getElementsByClassName('macro-preview-row-1')[0];
var macroPreviewRow2 = document.getElementsByClassName('macro-preview-row-2')[0];
var macroPreviewRowRoll = document.getElementsByClassName('macro-preview-row-roll');
var macroPreviewTitle = document.getElementsByClassName('frame-title-preview')[0];
themeMode.addEventListener('change', function(){
	if(themeMode.checked == true){
		themeModeIcon.src = 'icons/moon_icon.png';
		macroInfo.style = "background: linear-gradient(-45deg, #560033, #2d1336);";
		macroPreview.style = "background-color: #353535";
		macroPreviewSquare.style = "background-color: #1f1f1f;";
		macroPreviewRow2.style = "background-color: transparent; color: white;";
		macroPreviewRow1.style = "background-color: #353535; color: white;";
		for (var i = macroPreviewRowRoll.length - 1; i >= 0; i--) {
			macroPreviewRowRoll[i].style = "background-color: #702082;";
		}
		macroPreviewTitle.style = "color: white;";
	} else{
		themeModeIcon.src = 'icons/sun_icon.png';
		macroInfo.style = "background: linear-gradient(-45deg, #ea018c, #772b90);";
		macroPreview.style = "background-color: white";
		macroPreviewSquare.style = "background-color: transparent;";
		macroPreviewRow1.style = "background-color: #ccc; color: black;";
		macroPreviewRow2.style = "background-color: white; color: black;";
		for (var i = macroPreviewRowRoll.length - 1; i >= 0; i--) {
			macroPreviewRowRoll[i].style = "background-color: #fef68e;";
		}
		macroPreviewTitle.style = "color: #702082;";
	}
})

// Generate de Macro
macro = "";
function genMacro(){
	macroName = document.getElementsByName('macro-name')[0];
	macroAttribute = document.getElementsByName('macro-attribute')[0];
	macroImg = document.getElementsByName('macro-img-gif')[0];
	macroCriticalRange = document.getElementsByName('macro-critical-range')[0];
	macroDamage = document.getElementsByName('macro-damage')[0];
	macroCritical = document.getElementsByName('macro-critical')[0];
	macroProficiency = document.getElementsByName('macro-pb')[0];
	macroAttkQtd = document.getElementsByName('macro-attk-qtd')[0];
	macroGlobalAttack = document.getElementsByName('macro-global-attk-mod')[0];
	macroGlobalDamage = document.getElementsByName('macro-global-dmg-mod')[0];
	macroEffectType = document.getElementsByName('macro-effect-type')[0];
	macroEffectColor = document.getElementsByName('macro-effect-color')[0];

	macro = "&{template:default}{{name=" + macroName.value + "}}";
	var attribute = "";
	var proficiency = "";
	var globalDamage = "";
	var globalAttack = ""
	var effectType = "";
	var effectColor = "";
	var effect = "";

	if(macroImg.value != ""){
		macro += "{{[ignoretext](" + macroImg.value + "#.png)}}";
	}

	// Add attack type and damage type to macro
	const attackType = document.getElementsByName('macro-attack-type')[0];
	const damageType = document.getElementsByName('macro-damage-type')[0];
	
	if(attackType.selectedIndex > 0){
		macro += "{{Attack Type=" + attackType.value + "}}";
	}
	
	if(damageType.selectedIndex > 0){
		macro += "{{Damage Type=" + damageType.value + "}}";
	}

	if(macroAttribute.selectedIndex == 1){
		attribute = "+@{strength_mod}";
	} else if(macroAttribute.selectedIndex == 2){
		attribute = "+@{dexterity_mod}";
	} else if(macroAttribute.selectedIndex == 3){
		attribute = "+@{constitution_mod}";
	} else if(macroAttribute.selectedIndex == 4){
		attribute = "+@{intelligence_mod}";
	} else if(macroAttribute.selectedIndex == 5){
		attribute = "+@{wisdom_mod}";
	} else if(macroAttribute.selectedIndex == 6){
		attribute = "+@{charisma_mod}";
	}

	if(macroProficiency.checked == true){
		proficiency = "+@{pb}";
	}

	if(macroGlobalAttack.checked == true){
		globalAttack = '+@{global_attack_mod}';
	}

	if(macroGlobalDamage.checked == true){
		globalDamage = '+@{global_damage_mod_roll}';
	}

	if(macroAttkQtd.value == 1){
		macro += "{{ Attack: [[1d20cs>" + macroCriticalRange.value + attribute + proficiency + "(" + globalAttack + ")]] Advantage: [[1d20cs>" + macroCriticalRange.value +  attribute + proficiency + "(" + globalAttack + ")]]}}{{ Damage: [[" + macroDamage.value + attribute + globalDamage  + "]] Critical: [[" + macroCritical.value + attribute + globalDamage  + "]]}}"; 
	} else if(macroAttkQtd.value > 1){
		for(let i = 1; i <= macroAttkQtd.value; i++){
			macro += "{{ " + i + "° Attack: [[1d20cs>" + macroCriticalRange.value +  attribute + proficiency + "(" + globalAttack + ")]] Advantage: [[1d20cs>" + macroCriticalRange.value +  attribute + proficiency + "(" + globalAttack + ")]]}}{{ " + i + "° Damage: [[" + macroDamage.value + attribute + globalDamage + "]] Critical: [[" + macroCritical.value + attribute + globalDamage + "]]}}"; 
		}
	}

	macroOutput.innerHTML = macro;

	if(macroEffectType.selectedIndex != 0){
		if(macroEffectColor.selectedIndex != 0){
			switch(macroEffectType.selectedIndex){
			case 1:
				effectType = "\n/fx beam-";
				break;
			case 2:
				effectType = "\n/fx bomb-";
				break;
			case 3:
				effectType = "\n/fx breath-";
				break;
			case 4:
				effectType = "\n/fx bubbling-";
				break;
			case 5:
				effectType = "\n/fx burn-";
				break;
			case 6:
				effectType = "\n/fx explode-";
				break;
			case 7:
				effectType = "\n/fx glow-";
			case 8:
				effectType = "\n/fx missile-";
				break;
			case 9:
				effectType = "\n/fx nova-";
			case 10:
				effectType = "\n/fx splatter-";
				break;
			}

			switch(macroEffectColor.selectedIndex){
			case 1:
				effectColor = "acid";
				break;
			case 2:
				effectColor = "blodd";
				break;
			case 3:
				effectColor = "charm";
				break;
			case 4:
				effectColor = "death";
				break;
			case 5:
				effectColor = "fire";
				break;
			case 6:
				effectColor = "frost";
				break;
			case 7:
				effectColor = "holy";
				break;
			case 8:
				effectColor = "magic";
				break;
			case 9:
				effectColor = "slime";
				break;
			case 10:
				effectColor = "smoke";
				break;
			case 11:
				effectColor = "water";
				break;
			}
			effect = effectType + effectColor;
			macro += effect + " @{target|Source|token_id} @{target|Target|token_id}";
			macroOutput.innerHTML = macro;
		} else{
			macroOutput.innerHTML = "Select an effect color!";
		}
	}
}

function copyMacro(){
	navigator.clipboard.writeText(macro);
	alert("Macro copied to clipboard!");
}