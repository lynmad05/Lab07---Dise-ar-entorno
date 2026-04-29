# Laboratorio: Configuración de Balanceadores de Carga

**Curso:** Desarrollo de Soluciones en la Nube

---

# PARTE A — Balanceador de carga LOCAL con Node.js + Nginx

En esta parte se implementa un balanceador de carga usando **Nginx** que distribuye tráfico hacia múltiples instancias de una aplicación **Node.js** ejecutándose en distintos puertos.

---

##  Estructura del Proyecto

<img width="236" height="490" alt="image" src="https://github.com/user-attachments/assets/801bbbcf-6f84-4b8c-a276-edbfd9a1d6ea" />


---

## ⚙️ Paso 1: Instalación del entorno (WSL + dependencias)

> ⚙️ Este laboratorio fue desarrollado en **WSL (Windows Subsystem for Linux) con Ubuntu**, por lo que todos los comandos se ejecutan en un entorno Linux dentro de Windows.

Antes de iniciar, asegúrate de tener WSL instalado:

```powershell
wsl --install
```

Luego, dentro de Ubuntu (WSL), instala las dependencias:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install nginx nodejs npm mysql-server -y
```

Verificar instalaciones:

```bash
node -v
npm -v
nginx -v
```

---

## Paso 2: Estructura del proyecto

![alt text](image.png)

---

## Paso 3: Instalación del proyecto

Dentro de la carpeta del proyecto:

```bash
npm install
```

---

##  Paso 4: Ejecución de instancias Node.js

Se ejecutan **3 servidores backend en diferentes puertos**:

```bash
PORT=8081 INSTANCE_ID=A node index.js
PORT=8082 INSTANCE_ID=B node index.js
PORT=8083 INSTANCE_ID=C node index.js
```

Alternativa en segundo plano:

```bash
PORT=8081 INSTANCE_ID=A node index.js &
PORT=8082 INSTANCE_ID=B node index.js &
PORT=8083 INSTANCE_ID=C node index.js &
```

---

##  Paso 5: Código relevante (`index.js`)

```js
const INSTANCE_ID = process.env.INSTANCE_ID || 'A';
```

Permite identificar qué instancia responde.

---

##  Paso 6: Configuración del archivo `.env`

```env
PORT=8081
INSTANCE_ID=A

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=nombre_bd

JWT_SECRET=mi_secreto
```

⚠️ `.env` no se sube a GitHub.

---

## Paso 7: `.gitignore`

```gitignore
node_modules/
.env
```

---

## ⚖️ Paso 8: Configuración de Nginx

```bash
sudo nano /etc/nginx/conf.d/balanceador.conf
```

```nginx
upstream backends {
    server 127.0.0.1:8081;
    server 127.0.0.1:8082;
    server 127.0.0.1:8083;
}

server {
    listen 80;

    location / {
        proxy_pass http://backends;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }
}
```

---

##  Paso 9: Reiniciar Nginx

```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## Paso 10: Pruebas de backend

```bash
curl http://localhost:8081/api/info
curl http://localhost:8082/api/info
curl http://localhost:8083/api/info
```

---

##  Paso 11: Prueba del balanceador

```bash
for i in {1..10}; do curl -s http://localhost/api/info; echo; done
```

---

## 🌐 Paso 12: Prueba en navegador

```text
http://localhost
```

---

## 🧠 Nota importante

El entorno en **WSL puede generar pequeñas variaciones en el orden de respuestas**, pero el balanceo funciona correctamente (Round Robin).

---

##  Resultado esperado

* ✔ Node.js ejecutándose en 3 puertos
* ✔ Nginx distribuyendo tráfico
* ✔ Balanceo de carga funcional
* ✔ Proyecto ejecutado en WSL

---


# PARTE B — Balanceador de carga en AWS (Application Load Balancer)

## Paso 1: Crear una VPC y subredes

1. Ingresa a la **Consola de AWS → VPC → Crear VPC**.
2. Selecciona **VPC y más** y configura:
   - Nombre: `vpc-lab-lb`
   - CIDR IPv4: `10.0.0.0/16`
   - Zonas de disponibilidad: **2**
   - Subredes públicas: **2**
   - Subredes privadas: **0** (para simplificar)
3. Crea la VPC. Esto generará automáticamente un *Internet Gateway* y la tabla de rutas.

## Paso 2: Crear un Security Group

**EC2 → Security Groups → Create security group**

- Nombre: `sg-web-lab`
- VPC: `vpc-lab-lb`
- Reglas de entrada:
  - HTTP (80) desde `0.0.0.0/0`
  - SSH (22) desde tu IP (`Mi IP`)

## Paso 3: Lanzar dos instancias EC2

Lanza **2 instancias** con la siguiente configuración:

| Parámetro | Valor |
|-----------|-------|
| AMI | Amazon Linux 2023 |
| Tipo | `t2.micro` (Free Tier) |
| Par de claves | Crea o usa uno existente |
| VPC | `vpc-lab-lb` |
| Subred | Una en `us-east-1a`, otra en `us-east-1b` |
| Auto-asignar IP pública | Habilitar |
| Security Group | `sg-web-lab` |
| User Data | Ver script abajo |

**User Data (script de arranque):**

```bash
#!/bin/bash
#!/bin/bash

# Actualizar sistema
dnf update -y

# Instalar Apache
dnf install -y httpd

# Iniciar y habilitar Apache
systemctl start httpd
systemctl enable httpd

# Obtener metadata (con timeout para evitar fallos)
INSTANCE_ID=$(curl -s --connect-timeout 2 http://169.254.169.254/latest/meta-data/instance-id)
AZ=$(curl -s --connect-timeout 2 http://169.254.169.254/latest/meta-data/placement/availability-zone)

# Crear página HTML más visual
cat <<EOF > /var/www/html/index.html
<!DOCTYPE html>
<html>
<head>
    <title>Load Balancer AWS</title>
    <style>
        body {
            font-family: Arial;
            text-align: center;
            background: linear-gradient(135deg, #4facfe, #00f2fe);
            color: white;
            padding-top: 100px;
        }
        .card {
            background: rgba(0,0,0,0.3);
            padding: 30px;
            border-radius: 15px;
            display: inline-block;
        }
        h1 {
            font-size: 40px;
        }
        p {
            font-size: 20px;
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>Servidor Web AWS</h1>
        <p><b>Instance ID:</b> $INSTANCE_ID</p>
        <p><b>Availability Zone:</b> $AZ</p>
    </div>
</body>
</html>
EOF

```

Etiqueta las instancias como `web-server-1` y `web-server-2`.

Verifica accediendo por separado a la IP pública de cada instancia: ambas deben mostrar páginas distintas.

## Paso 4: Crear el Target Group

**EC2 → Target Groups → Create target group**

- Tipo de destino: **Instances**
- Nombre: `tg-lab-web`
- Protocolo: HTTP, Puerto: 80
- VPC: `vpc-lab-lb`
- Health check path: `/`
- Avanzado: umbrales saludables/no saludables = 2/2, intervalo = 30s
- **Registrar destinos:** selecciona las dos EC2 y agrégalas como pendientes en el puerto 80.

## Paso 5: Crear el Application Load Balancer

**EC2 → Load Balancers → Create Load Balancer → Application Load Balancer**

- Nombre: `alb-lab-web`
- Esquema: **Internet-facing**
- Tipo de IP: IPv4
- VPC: `vpc-lab-lb`
- Mappings: las **dos** zonas de disponibilidad con sus subredes públicas
- Security Group: `sg-web-lab`
- Listener: HTTP:80 → forward a `tg-lab-web`
- Crear el balanceador.

Espera 2-3 minutos hasta que el estado pase a **Active**.

## Paso 6: Probar el ALB

Copia el **DNS name** del ALB (algo como `alb-lab-web-1234567890.us-east-1.elb.amazonaws.com`) y pégalo en el navegador. Refresca varias veces: deberías ver alternarse las dos instancias.

---

# ✅ Conclusión

* Se implementó balanceo de carga local con **Nginx + Node.js**
* Se configuró un entorno distribuido en AWS con **Application Load Balancer**
* Se verificó distribución de tráfico entre múltiples instancias

---

Si quieres, puedo también:

* Mejorarte el README para que parezca más “proyecto profesional”
* Agregarte diagramas (tipo arquitectura)
* O ayudarte a dockerizar todo (eso ya te sube bastante nivel 😄)
