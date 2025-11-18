const API_KEY = "AIzaSyDIqHrjwl5mZITcF5cW4mY3xoOnpB7jlp0"; // Clave ficticia para ejemplo
 // Modelo actualizado a 2.5
const MODEL = "gemini-2.5-flash";
const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

// ---- Inicializar localStorage si no existe ----
if (!localStorage.getItem("correctas")) {
  localStorage.setItem("correctas", "0");
}
if (!localStorage.getItem("incorrectas")) {
  localStorage.setItem("incorrectas", "0");
}

async function generaPregunta(){

    const temas = [
        "concepto de arreglo y operaciones sobre arreglos",
        "concepto de diccionarios y funciones básicas",
        "operadores lógicos, aritméticos, de comparación, ternario",
        "uso de la consola para debuggear",
        "funciones con parámetros por default"];

    const temaAleatorio = temas[Math.floor(Math.random() * temas.length)];
 
const prompt = `En el contexto de JavaScript, CSS y HTML. Genera una pregunta de opción múltiple sobre el siguiente tema ${temaAleatorio}. Proporciona cuatro opciones de respuesta y señala cuál es la correcta.    
            Genera la pregunta y sus posibles respuestas en formato JSON como el siguiente ejemplo, asegurándote de que el resultado SÓLO contenga el objeto JSON y no texto adicional enseguida te doy dos ejemplos:  
            1. Sobre arreglos en JavaScript:
            {
              "question": "¿Cuál de los siguientes métodos agrega un elemento al final de un arreglo en JavaScript?",
              "options": [
                "a) shift()",
                "b) pop()",
                "c) push()",
                "d) unshift()",
              ],
              "correct_answer": "c) push()",
              "explanation": "El método push() agrega uno o más elementos al final de un arreglo y devuelve la nueva longitud del arreglo."
            }
              2. Sobre eventos en JavaScript:
            {
              "question": "¿Cuál de los siguientes eventos se dispara cuando un usuario hace clic en un elemento HTML?",
              "options": [
                "a) onmouseover",
                "b) onclick",
                "c) onload",
                "d) onsubmit"
              ],
              "correct_answer": "b) onclick",
              "explanation": "El evento 'onclick' se dispara cuando un usuario hace clic en un elemento HTML, permitiendo ejecutar funciones en respuesta a ese clic."
            }
              
            `;    
        try {
            const response = await fetch(
                url,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: prompt }]
                        }],
                        // Opcional: añadir la configuración de generación
                        generationConfig: {
                            temperature: 0.25,
                            responseMimeType: "application/json"
                        },
                    }),
                }
            );

            // Manejo de errores de HTTP
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error HTTP ${response.status}: ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            console.log("Respuesta transformada a json:", data);

            
            // Extracción simple del texto de la respuesta, asumiendo que la respuesta tiene al menos una 'candidate' y 'part'     
            const textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text;

            const textResultTrimmed = textResult.trim();
            const firstBraceIndex = textResultTrimmed.indexOf('{');
            const lastBraceIndex = textResultTrimmed.lastIndexOf('}');
            const jsonString = textResultTrimmed.substring(firstBraceIndex, lastBraceIndex + 1);


            if (jsonString) {            
                const questionData = JSON.parse(jsonString);
                console.log(questionData);
                return questionData;
            } else {
                console.log("No se pudo extraer el texto de la respuesta.");
            }

        } catch (error) {
            console.error("Hubo un error en la petición:", error);
            document.getElementById('question').textContent = 'Error al cargar la pregunta. Por favor, revisa la clave API o la consola.';
            return null;
        }
}

        async function cargarPregunta() {
        // Mostrar mensaje de carga
        document.getElementById('question').className = 'text-warning';
        document.getElementById('question').textContent = 'Cargando pregunta de Gemini...';
        document.getElementById('options').innerHTML = '';

        const datosPregunta = await generaPregunta();
        console.log(datosPregunta);

        if (datosPregunta) {
            document.getElementById('question').className = 'text-success';
            console.log("Datos de la pregunta recibidos:", datosPregunta);
            desplegarPregunta(datosPregunta);
        }
        }


    function desplegarPregunta(datosPregunta){
        document.getElementById("question").innerHTML = datosPregunta["question"];

        window.preguntaActual = datosPregunta; // guarda pregunta para mostrar la explicacion 
        const optionsDiv = document.getElementById("options"); // se obtiene el div donde se colocaran las opciones
        optionsDiv.innerHTML = "";  // limpia las opciones anteriores

        datosPregunta.options.forEach((opcion) => { // recorrer todas las opciones que vienen del JSON
            const btn = document.createElement("button"); // crear un boton para cada opcion
            btn.className = "btn-opcion"

            btn.textContent = opcion; // el texto del boton correspondera a cada una de las opciones

            btn.onclick = () => validarRespuesta(opcion, datosPregunta.correct_answer)  // al hacer click se llama a validar respuestas
            optionsDiv.appendChild(btn); // Agregar el boton al contenedor HTML
        });
        limpiarResultado();
    }

    function validarRespuesta(opcionSeleccionada, respuestaCorrecta){
        const esCorrecta = opcionSeleccionada === respuestaCorrecta;

        if (esCorrecta) {
            aumentarContador("correctas");
            mostrarResultado("¡Correcto!", "success");
        } else {
            aumentarContador("incorrectas");
            mostrarResultado(`Incorrecto. La respuesta correcta es: ${respuestaCorrecta}`, "danger");
        }

        deshabilitarBotones();

        // Espera 2 segundos y carga otra
        setTimeout(() => {
            cargarPregunta();
        }, 2000);
    }

    function mostrarResultado(mensaje, tipo){
        let div = document.getElementById("resultado");

        // si el cuadro no existe, lo crea abajo de la pregunta
        if(!div){
            div = document.createElement("div");
            div.id = "resultado";
            document.getElementById("question-container").appendChild(div);
        }

        // cambia el estilo visual dependiendo del resultado 
        div.className = `alert alert-${tipo} mt-3`;

        // muestra el mensaje (correcto/incorrecto), mas la explicacion
        div.innerHTML = `
            <strong>${mensaje}</strong><br>
            <em>${preguntaActual.explanation}</em>
        `;
    }

    function aumentarContador(tipo){
        let valor = parseInt(localStorage.getItem(tipo));
        valor ++;

        localStorage.setItem(tipo,valor);
        desplegarContadores();
    }

    // elimina el cuadro de resultado para la siguiente pregunta
    function limpiarResultado(){
        const div = document.getElementById("resultado");
        if (div) div.remove(); // si existe, lo borra del DOM
    }

    function deshabilitarBotones(){
        // busca todos los botones de opciones
        const botones = document.querySelectorAll(".btn-opcion"); 
        // los desactiva uno por uno
        botones.forEach(btn => btn.disabled = true);
    }
    window.onload = () => {
        console.log("Página cargada y función inicial ejecutada.");
        //desplegarContadores();
        cargarPregunta();    
    };

            
    function desplegarContadores(){
        document.getElementById("correctas").textContent = localStorage.getItem("correctas"); // muestra cuantas respuestas correctas hay
        document.getElementById("incorrectas").textContent = localStorage.getItem("incorrectas"); // muestra cuantas respuestas incorrectas hay
    }

generaPregunta();