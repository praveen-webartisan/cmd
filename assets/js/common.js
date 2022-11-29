(function($) {
	let commandIndex = -1, lastCommand = '';

	const Storage = {
		'storageClass': localStorage,
		'get': function(key, isJson = true) {
			let value = Storage.storageClass.getItem(key);

			if (isJson) {
				value = JSON.parse(value);
			}

			return value;
		},
		'set': function(key, value, isJson = true) {
			if (isJson) {
				value = JSON.stringify(value);
			}

			return Storage.storageClass.setItem(key, value);
		},
		'delete': function(key) {
			return Storage.storageClass.removeItem(key);
		},
		'Array': function(key) {
			let arrayValue = Storage.get(key) || [];

			return {
				'append': function(newValue) {
					// Avoid duplicate entries
					if (arrayValue.length == 0 || arrayValue.indexOf(newValue) != (arrayValue.length - 1)) {
						arrayValue.push(newValue);

						Storage.set(key, arrayValue);
					}
				},
			};
		},
	};

	const commandsList = {
		'help': function() {
			return $('#tmplHelp').html();
		},
		'history': function(option) {
			if (option) {
				if (option == '-c') {
					Storage.delete('history');
				}

				return '';
			} else {
				let history = Storage.get('history');
				let content = '';

				(history || []).forEach(function(cmd, i) {
					content += `${i + 1}. ${cmd}\n`;
				});

				return content.replace(/\n/g, '<br>');
			}
		},
		'clear': function() {
			clearConsoleScreen(false);

			return '';
		},
		'about': function() {
			return $('#tmplAbout').html();
		},
		'role': function() {
			return $('#tmplRole').html();
		},
		'work': function() {
			return $('#tmplWork').html();
		},
		'hobbies': function() {
			return $('#tmplPersonalProjects').html();
		},
		'experience': function() {
			return $('#tmplExperience').html();
		},
		'contact': function() {
			return $('#tmplContact').html();
		},
		'shortcuts': function() {
			return $('#tmplShortcuts').html();
		},
		'now': function() {
			return (new Date().toString());
		},
		'matrix': function() {
			return '<div class="matrix-effect-container"><canvas class="matrix-effect"></canvas></div>';
		},
	};

	function matrixEffect(matrixElem, canvas, context, columns, maxStackHeight) {
		context.fillStyle = `rgba(0, 0, 0, ${matrixElem.prop('matrixEffectFadeFactor')})`;
		context.fillRect(0, 0, canvas.width, canvas.height);

		context.font = (matrixElem.prop('matrixEffectTileSize') - 2) + 'px monospace';
		context.fillStyle = 'rgb(0, 255, 0)';

		for (let i = 0; i < columns.length; ++i) {
			let randomChar = String.fromCharCode(33 + Math.floor(Math.random() * 94));

			context.fillText(randomChar, columns[i].x, columns[i].stackCounter * matrixElem.prop('matrixEffectTileSize') + matrixElem.prop('matrixEffectTileSize'));

			if (++columns[i].stackCounter >= columns[i].stackHeight) {
				columns[i].stackHeight = 10 + Math.random() * maxStackHeight;
				columns[i].stackCounter = 0;
			}
		}

		setTimeout(() => {
			matrixEffect(matrixElem, canvas, context, columns, maxStackHeight);
		}, 50);
	}

	$.fn.initMatrixEffect = function() {
		const canvas = this[0];

		this.prop('matrixEffectTileSize', 18);
		this.prop('matrixEffectFadeFactor', 0.05);

		canvas.width = canvas.offsetWidth;
		canvas.height = canvas.offsetHeight;

		const context = canvas.getContext('2d');

		const maxStackHeight = Math.ceil(canvas.height / this.prop('matrixEffectTileSize'));
		let columns = [];

		for (let i = 0; i < canvas.width / this.prop('matrixEffectTileSize'); ++i) {
			columns.push({
				'x': i * this.prop('matrixEffectTileSize'),
				'stackHeight': 10 + Math.random() * maxStackHeight,
				'stackCounter': 0,
			});
		}

		matrixEffect(this, canvas, context, columns, maxStackHeight);
	};

	function textTypingEffect(parentElem, elem, charIndex = 0, direction = 'right') {
		parentElem = parentElem || $('body');
		let typingContent = elem.prop('typingContent');

		if (charIndex == 0) {
			elem.addClass('typing');
			elem.html('');
		} else if (charIndex > typingContent.length) {
			if (elem.prop('typingSeqElements') != undefined) {
				parentElem.find('.typing-effect[data-type-seq="' + elem.prop('typingSeqElements') + '"]').each(function() {
					textTypingEffect(parentElem, $(this));
				});
			}

			if (elem.hasClass('type-infinite')) {
				// After typed entire sentence, delete them
				setTimeout(() => {
					textTypingEffect(parentElem, elem, (typingContent.length - 1), 'left');
				}, 1000);
			} else {
				// Retain blinking cursor on last element
				if (elem.prop('typingSeqElements') != undefined) {
					elem.removeProp('typingSeqElements');

					elem.removeClass('typing');
				}
			}

			return;
		} else if (charIndex < 0) {
			// After deleted all the letters, start typing
			setTimeout(() => {
				textTypingEffect(parentElem, elem, 0);
			}, 1000);

			return;
		}

		elem.html(typingContent.substr(0, charIndex));

		setTimeout(() => {
			textTypingEffect(parentElem, elem, (direction == 'right' ? charIndex + 1 : charIndex - 1), direction);
		}, 50);
	}

	function initTypingEffect(parentElem) {
		let seqList = [];

		parentElem.find('.typing-effect').each(function() {
			let initialContent = $(this).text();

			$(this).prop('typingContent', initialContent);

			// Initialize sequenced containers later
			if ($(this).attr('data-type-seq') == undefined) {
				textTypingEffect(parentElem, $(this));
			} else {
				$(this).html('');

				let seq = $(this).attr('data-type-seq');

				if (seq.indexOf('-') > -1) {
					seq = seq.split('-');

					if (seq.length == 2) {
						if (Number(seq[0]) != isNaN && Number(seq[1]) != isNaN) {
							if (seqList[ seq[0] ] == undefined) {
								seqList[ seq[0] ] = [
									seq[1]
								];
							} else {
								seqList[ seq[0] ].push( seq[1] );
							}
						}
					}
				}
			}
		});

		seqList.sort();

		seqList.forEach(function(seq, firstPart) {
			seq.sort();

			seq.forEach(function(secondPart, i) {
				if (i < (seq.length - 1)) {
					parentElem.find(`.typing-effect[data-type-seq="${firstPart}-${ secondPart }"]`).prop('typingSeqElements', `${firstPart}-${seq[i + 1]}`);
				}
			});

			textTypingEffect(parentElem, parentElem.find(`.typing-effect[data-type-seq="${firstPart}-${ seq[0] }"]`));
		});
	}

	function renderCommandRow() {
		let linuxConsole = $('#linuxConsole');

		linuxConsole.find('.linux-console-cmd-row-cmd-txt').attr('disabled', true);

		linuxConsole.append($('#tmplCommandRow').html());

		linuxConsole.find('.linux-console-cmd-row:last').find('.linux-console-cmd-row-cmd-txt').focus();

		lastCommand = '';
	}

	function onEnterPressed() {
		let linuxConsole = $('#linuxConsole');
		let command = linuxConsole.find('.linux-console-cmd-row:last').find('.linux-console-cmd-row-cmd-txt').val();
		command = command.toLowerCase().trim();

		if (command.length > 0) {
			Storage.Array('history').append(command);

			executeCommand(command);
		}

		commandIndex = -1;

		renderCommandRow();

		if ($('#linuxConsole').find('.linux-console-cmd-output:last').length > 0) {
			$('#linuxConsole').find('.linux-console-cmd-output:last')[0].scrollIntoView();
		}
	}

	function executeCommand(command) {
		command = command.toLowerCase().trim();
		// Array.filter(element => element) to remove empty elements
		let commandArray = command.split(' ').filter(tempCommand => tempCommand);

		if (commandArray.length > 0) {
			let commandName = commandArray[0];
			let commandArgs = commandArray.slice(1);
			let output = 'Command not found!';

			if (commandName) {
				let commandFn = commandsList[commandName];

				if (commandFn) {
					output = commandFn.apply(null, commandArgs) || '';
				}
			}

			$('#linuxConsole').find('.linux-console-cmd-row:last').after($('#tmplCommandOutput').html().replace('OUTPUT', output));

			if ($('#linuxConsole').find('.linux-console-cmd-output:last .typing-effect').length > 0) {
				initTypingEffect($('#linuxConsole').find('.linux-console-cmd-output:last'));
			}

			if ($('#linuxConsole').find('.linux-console-cmd-output:last .matrix-effect').length > 0) {
				$('#linuxConsole').find('.linux-console-cmd-output:last .matrix-effect').initMatrixEffect();
			}
		}
	}

	$(document).on('keypress', '.linux-console-cmd-row-cmd-txt', function(e) {
		// If enter key pressed
		if((e.keyCode || e.which) == 13) {
			onEnterPressed();
		}
	});

	function clearConsoleScreen(promptCmd = true) {
		$('#linuxConsole > *').remove();

		if (promptCmd) {
			renderCommandRow();
		}
	}

	function showCommandFromHistory(direction) {
		let activeTextBox = $('#linuxConsole').find('.linux-console-cmd-row:last').find('.linux-console-cmd-row-cmd-txt');
		let history = Storage.get('history') || [];

		if (direction == 'previous') {
			if (commandIndex < 0) {
				commandIndex = history.length - 1;
			} else if (commandIndex == 0) {
				commandIndex = 0;
			} else {
				commandIndex--;
			}
		} else if (direction == 'next') {
			if (commandIndex > (history.length - 1) || commandIndex < 0) {
				commandIndex = -1;
			} else {
				commandIndex++;
			}
		}

		let newCommand = history[ commandIndex ];

		activeTextBox.val(newCommand);
	}

	$(document).on('keydown', '.linux-console-cmd-row-cmd-txt', function(e) {
		let pressedKeyCode = (e.keyCode || e.which);

		// If Ctrl+L pressed
		if (e.ctrlKey && pressedKeyCode == 76) {
			e.preventDefault();
			e.stopPropagation();

			clearConsoleScreen();
		} else if(pressedKeyCode == 38) {
			// If Up arrow pressed
			e.preventDefault();
			e.stopPropagation();

			showCommandFromHistory('previous');
		} else if(pressedKeyCode == 40) {
			// If Down arrow pressed
			e.preventDefault();
			e.stopPropagation();

			showCommandFromHistory('next');
		} else if(pressedKeyCode == 9) {
			// IF TAB pressed
			e.preventDefault();
			e.stopPropagation();
		}
	});

	$(document).on('input', '.linux-console-cmd-row-cmd-txt', function() {
		lastCommand = $(this).val();
	});

	$(document).on('keydown', function(e) {
		// If ESC pressed
		if ((e.keyCode || e.which) == 27) {
			if (!$('#linuxConsole').find('.linux-console-cmd-row:last').find('.linux-console-cmd-row-cmd-txt').is(document.activeElement)) {
				$('#linuxConsole').find('.linux-console-cmd-row:last').find('.linux-console-cmd-row-cmd-txt').focus();
			}
		}
	});

	$(document).on('click', '.linux-console', function(e) {
		if (!$(e.target).is('.linux-console .linux-console-cmd-row')) {
			$('#linuxConsole').find('.linux-console-cmd-row:last').find('.linux-console-cmd-row-cmd-txt').focus();
		}
	});

	$(document).on('click', '.execute-cmd', function(e) {
		e.preventDefault();
		e.stopPropagation();

		let commandToExecute = $(this).attr('data-cmd');
		$('#linuxConsole').find('.linux-console-cmd-row:last').find('.linux-console-cmd-row-cmd-txt').val(commandToExecute);
		onEnterPressed();
	});

	$(document).ready(function() {
		renderCommandRow();

		let pageVisitCount = (Storage.get('pageVisitCount') || 0);

		if (pageVisitCount == 0 && (Storage.get('history') || []).length == 0) {
			$('#linuxConsole').find('.linux-console-cmd-row:last').find('.linux-console-cmd-row-cmd-txt').val('help');
			onEnterPressed();
		}

		Storage.set('pageVisitCount', pageVisitCount + 1);

		/*$('.matrix-effect').each(function() {
			$(this).initMatrixEffect();
		});*/
	});

}) (jQuery);