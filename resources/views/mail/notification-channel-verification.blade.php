<x-mail::message>
# Verificação de canal

Use o código abaixo para confirmar este email como canal de notificação:

**{{ $code }}**

O código expira em {{ $expiresInMinutes }} minutos.

Se você não solicitou isso, ignore este email.

Obrigado,<br>
{{ config('app.name') }}
</x-mail::message>
