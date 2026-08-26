<x-mail::message>
# Alerta disparado

A API **{{ $monitorName }}** acionou o alerta **{{ $alertName }}**.

- URL: {{ $monitorUrl }}
- Tipo: {{ $alertType }}
- Condição: {{ $operator }} {{ $value }}
- Horário: {{ now()->timezone(config('app.timezone'))->format('d/m/Y H:i:s') }}

<x-mail::button :url="$unsubscribeUrl">
Cancelar inscrição neste alerta
</x-mail::button>

Obrigado,<br>
{{ config('app.name') }}
</x-mail::message>
