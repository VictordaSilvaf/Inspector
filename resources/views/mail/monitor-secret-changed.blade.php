<x-mail::message>
# Credencial alterada

A credencial do monitor **{{ $monitorName }}** foi modificada.

**Ação:** {{ $actionLabel }}

**Monitor:** {{ $monitorUrl }}

@if ($actorName)
**Alterado por:** {{ $actorName }}
@endif

**Quando:** {{ $changedAt }}

Se você não reconhece esta alteração, altere sua senha e revise a autenticação em dois fatores imediatamente.

<x-mail::button :url="route('api-inspector.show', $monitorId)">
Ver monitor
</x-mail::button>

O valor da credencial nunca é incluído neste e-mail.

</x-mail::message>
