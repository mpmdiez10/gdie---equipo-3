$(function() {
    const { Subject } = rxjs;
    const eventBus_piano = new Subject();
    const eventBus_sheets = new Subject();
    
    $('video-component')[0].subjectPiano = eventBus_piano;
    $('piano-component')[0].subject = eventBus_piano;

    $('video-component')[0].subjectSheets = eventBus_sheets;
    $('sheet-component')[0].subject = eventBus_sheets;
    
});