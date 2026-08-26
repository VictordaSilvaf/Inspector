<x-mail::message>
# API recuperada

A API **{{ $monitorName }}** voltou ao estado normal.

- URL: {{ $monitorUrl }}
- Alerta: {{ $alertName }}
- Horário: {{ now()->timezone(config('app.timezone'))->format('d/m/Y H:i:s') }}

<x-mail::button :url="$unsubscribeUrl">
Cancelar inscrição neste alerta
</x-mail::button>

Obrigado,<br>
{{ config('app.name') }}
</x-mail::message>
