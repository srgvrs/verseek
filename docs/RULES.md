
Reglas operativas adicionales para agentes (IA o desarrolladores).

---

## 1. Cuándo detenerse

Si una tarea te está llevando demasiado tiempo y estás dando vueltas sin una
solución directa:

1. **Detente.** No sigas iterando sobre el mismo razonamiento.
2. **Explica el bloqueo.** Di en qué punto estás atascado, qué has intentado y
   por qué no avanza.
3. **Espera instrucciones.** No inventes una solución forzada ni cambies de
   enfoque sin que el usuario lo indique.

El criterio de "demasiado tiempo" lo determina el propio agente: si detectas
que estás repitiendo el mismo análisis o releyendo los mismos archivos sin
producir un cambio concreto, es señal de que debes parar y reportar.

> Ejemplo: si al corregir un bug no puedes decidir en qué módulo vive la causa
> y llevas varias vueltas releyendo los mismos archivos, detente y di
> "estoy atascado en X, necesito Y para continuar".
