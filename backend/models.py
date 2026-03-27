from datetime import datetime
from database import db


class MenuItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    portions = db.Column(db.Integer, default=0)
    cutoff_time = db.Column(db.DateTime, nullable=False)
    orders = db.relationship('Order', backref='menu_item', lazy=True)


class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey('menu_item.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    delivered = db.Column(db.Boolean, default=False)
    timestamp = db.Column(db.DateTime, default=datetime.now)
