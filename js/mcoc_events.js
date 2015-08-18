function Event(template, startDate, startTime, length) {
    this.length = length;
    this.code = template.code;
    this.name = template.name;
    this.startDate = moment(startDate).add(startTime.hour, 'hours').add(startTime.minute, 'minutes');
    this.endDate = moment(this.startDate).add(this.length, 'days').add(-1, 'seconds');
}

function buildEventsList(data, startData, sevenDayStartData) {
    var output = [];

    var currentDate = moment(startData.date);
    var nextStartDate = moment(currentDate);
    var stopDate = moment.utc().startOf('day').add(7, 'days');

    data = data.concat(data.splice(0, startData.index));

    var index = 0;
    while (currentDate <= stopDate) {
        if (currentDate.isSame(nextStartDate, 'day') == true) {
            nextStartDate.add(data[index].length, 'days');
            index = createAndPushEvent(index, output, data, currentDate, startData.time, null);
        }

        if (sevenDayStartData != null) {
            if (currentDate.diff(sevenDayStartData.date, 'days') % 14 == 0) {
                index = createAndPushEvent(index, output, data, currentDate, sevenDayStartData.time, 7);
            }
        }

        currentDate.add(1, 'days');
    }

    return output;
}

function createAndPushEvent(index, events, data, currentDate, startTime, length) {
    var template = data[index];
    var event = new Event(template, currentDate, startTime, length != null ? length : template.length)
    events.push(event);

    index++;
    if (index >= data.length) {
        index = 0;
    }

    return index;
}

function buildEventsHtml(events) {
    var output = "";
    var isFirstFutureEvent = true;

    for (var i = 0; i < events.length; i++) {
        var event = events[i];

        var lengthWord = "";
        switch (event.length) {
            case 1: lengthWord = "Daily"; break;
            case 3: lengthWord = "Three-Day"; break;
            case 7: lengthWord = "Seven-Day"; break;
        }

        var message = "";
        var localTime = moment.utc().local();
        var startDate = event.startDate.local();
        var endDate = event.endDate.local();

        if (startDate < localTime) {
            if (localTime.isSame(endDate, 'day') == true) {
                message = "ends today";
            }
            else if (moment(localTime).add(1, 'days').isSame(endDate, 'day') == true) {
                message = "ends tomorrow";
            }
            else {
                message = "ends " + endDate.format("dddd MMMM D");
            }
        }
        else {
            if (isFirstFutureEvent == true) {
                isFirstFutureEvent = false;
                output += "<li class=\"spacer\"><hr /></li>";
            }

            if (localTime.isSame(startDate, 'day') == true) {
                message = "starts today";
            }
            else if (moment(localTime).add(1, 'days').isSame(startDate, 'day') == true) {
                message = "starts tomorrow";
            }
            else {
                message = "starts " + startDate.format("dddd MMMM D");
            }
        }

        output += "<li class=\"" + event.code + " " + lengthWord.toLowerCase() + "-event\"><div><span class=\"length\">" + event.name + " </span><span class=\"length\">[" + lengthWord + " Event]</span><br /><span class=\"message\">" + message + "</span></div></li>";
    }

    return output;
}

function convertUtcTimeToLocalTime(startTimeObject) {
    return moment.utc().hour(startTimeObject.hour).minute(startTimeObject.minute).local().format("h:mm A")
}

var oneDayEventStartTime = { hour: 17, minute: 30 };
var oneDayEventTemplates = [
    { length: 1, code: "de-ru", name: "Rank Up" },
    { length: 1, code: "de-cs", name: "Class Specialist" },
    { length: 1, code: "de-dd", name: "Draw Duplicates" },
    { length: 1, code: "de-qc", name: "Quest Completion" },
    { length: 1, code: "de-ds", name: "Duel Skirmish" },
    { length: 1, code: "de-cr", name: "Crystal Rush" },
    { length: 1, code: "de-aw", name: "Arena Wins" }
];

var threeDayEventStartTime = { hour: 16, minute: 30 };
var sevenDayEventStartTime = { hour: 19, minute: 00 };
var threeDayEventTemplates = [
    { length: 3, code: "td-c", name: "Completion" },
    { length: 3, code: "td-rup", name: "Rank Up Push" },
    { length: 3, code: "td-ac", name: "Arena Combat" },
    { length: 3, code: "td-cc", name: "Crystal Crash" },
    { length: 3, code: "td-ps", name: "Perfect Series" },
];

function displayEvents(selector) {
    // event start time objects will get added to the times listed here
    var oneDayEventStart = { index: 0, time: oneDayEventStartTime, date: "2015-08-02 00:00Z" };
    var threeDayEventStart = { index: 0, time: threeDayEventStartTime, date: "2015-08-11 00:00Z" };
    var sevenDayEventStart = { index: 0, time: sevenDayEventStartTime, date: "2015-08-13 00:00Z" };

    var oneDayEvents = buildEventsList(oneDayEventTemplates, oneDayEventStart, null);
    var threeDayEvents = buildEventsList(threeDayEventTemplates, threeDayEventStart, sevenDayEventStart);
    var events = oneDayEvents.concat(threeDayEvents);

    events.sort(function (l, r) {
        return l.startDate - r.startDate;
    });

    events = events.filter(function (event) {
        return event.endDate > moment.utc();
    });

    var html = buildEventsHtml(events);
    $(selector).html(html);
};

function displayEventStartTimes(selectors) {
    $(selectors[0]).text(convertUtcTimeToLocalTime(oneDayEventStartTime));
    $(selectors[1]).text(convertUtcTimeToLocalTime(threeDayEventStartTime));
    $(selectors[2]).text(convertUtcTimeToLocalTime(sevenDayEventStartTime));
}
