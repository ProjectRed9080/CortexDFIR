Actúa como un Diseñador Lead de UX/UI y Sistema de Diseño especializado en plataformas SOC/DFIR de ciberseguridad.

Tu objetivo es refactorizar la paleta de colores y el sistema de componentes visuales de la interfaz web (Modo Oscuro) aplicando principios de Diseño Centrado en el Usuario (DCU) y cumpliendo las pautas de accesibilidad WCAG 2.1 AA.

Aplica estrictamente las siguientes correcciones de color, legibilidad y semántica visual:

1. MEJORA DE LEGIBILIDAD Y CONSTRASTE EN TEXTOS (WCAG AA):
   - Reemplaza el tono gris/azul apagado de las descripciones y etiquetas secundarias (ej. "Filas analizadas", "Ráfagas de fallos...", "Herramientas de reconocimiento...") por el token #94A3B8 (Gris Muted Alto Contraste).
   - Asegura una relación de contraste mínima de 4.5:1 sobre los fondos oscuros (#161E2E / #0E1726) para evitar la fatiga visual en monitoreo continuo.

2. CORRECCIÓN SEMÁNTICA DEL AZUL/CYAN (AFFORDANCE & INTERACTIVIDAD):
   - Uso Exclusivo del Cyan (#0EA5E9 / #38BDF8): Reserva el color cyan únicamente para elementos interactivos y de acción (botones, enlaces de "Inspeccionar →", "Ver Detalle de Hallazgos →" y estados de hover/focus).
   - Datos Estáticos y Títulos: Cambia los títulos principales (ej. "Incidente_APT_MultiEtapa.xlsx") y los números de métricas/KPIs no interactivos a #FFFFFF o #F8FAFC para evitar la confusión visual entre lo clicable y lo informativo.

3. REDUCCIÓN DE LA FATIGA DE ALERTAS (ALERT FATIGUE):
   - Reestructura los insignias "POSITIVO" en las tarjetas de categorías detectadas.
   - Sustituye el bloque/badge de fondo rojo sólido saturado por un indicador más fino y pulido: fondo neutro/transparente con borde delgado de 1px en #EF4444 y texto rojo claro, reservando el relleno rojo sólido exclusivamente para la badge principal de severidad ("RIESGO CRÍTICO").

4. ESTRUCTURA DE TOKENS DE COLOR UI:
   - Fondo de pantalla (Canvas): #0B0F19 (Gris Noche Extra Oscuro).
   - Fondo de contenedores / tarjetas: #161E2E o #0E1726 con borde sutil en #26334D.
   - Textos principales y valores KPI: #FFFFFF / #F1F5F9.
   - Textos secundarios y descripciones: #94A3B8.
   - Acciones / Links interactivos: #0EA5E9.
   - Alertas Críticas / Riesgo Alto: #EF4444 (Crítico) y #F59E0B (Alto).

Genera el código o la especificación de componentes UI ajustada para eliminar la carga cognitiva y garantizar una experiencia de monitoreo ágil y accesible.